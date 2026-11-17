"""conversation 工作区选择 RPC 接口测试。"""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest

from app.application import Application
from app.models.registry import ModelAdapterRegistry
from app.server.rpc import JsonRpcError
from app.server.rpc.methods.conversations import (
    conversation_create,
    conversation_get,
    conversation_send,
    conversation_set_workspace,
)


@pytest.fixture
async def rpc_ctx(tmp_path: Path):
    db_path = tmp_path / "vesta.db"
    tasks_dir = tmp_path / "tasks"
    mcp_config = tmp_path / "mcp.json"
    mcp_config.write_text("{}", encoding="utf-8")
    app = Application(
        database=db_path,
        tasks_dir=tasks_dir,
        mcp_config=mcp_config,
        registry=ModelAdapterRegistry(),
        provider="fake",
        model="fake-model",
    )
    await app.start()
    try:
        ctx = SimpleNamespace(application=app, connection=None)
        yield ctx, tmp_path
    finally:
        await app.close()


@pytest.mark.asyncio
async def test_rpc_create_and_set_workspace(rpc_ctx):
    ctx, tmp_path = rpc_ctx
    ws_dir = tmp_path / "my_code"
    ws_dir.mkdir()

    # 创建时带工作区
    res1 = await conversation_create({"title": "带工作区", "workspace_path": str(ws_dir)}, ctx)
    c1 = res1["conversation"]
    assert c1.workspace_path == str(ws_dir.resolve())
    assert c1.workspace_fixed is False

    # 创建不带工作区（No project）
    res2 = await conversation_create({"title": "默认无工作区"}, ctx)
    c2 = res2["conversation"]
    assert c2.workspace_path is None
    assert c2.workspace_fixed is False

    # 动态设置为 ws_dir
    res3 = await conversation_set_workspace(
        {"conversation_id": c2.id, "workspace_path": str(ws_dir)},
        ctx,
    )
    assert res3["conversation"].workspace_path == str(ws_dir.resolve())

    # 恢复为 No project
    res4 = await conversation_set_workspace(
        {"conversation_id": c2.id, "workspace_path": None},
        ctx,
    )
    assert res4["conversation"].workspace_path is None


@pytest.mark.asyncio
async def test_rpc_set_workspace_validates_path(rpc_ctx):
    ctx, tmp_path = rpc_ctx
    res = await conversation_create({}, ctx)
    conv_id = res["conversation"].id

    # 传入不存在的目录
    with pytest.raises(JsonRpcError, match="目录不存在或不是文件夹"):
        await conversation_set_workspace(
            {"conversation_id": conv_id, "workspace_path": str(tmp_path / "not_exist")},
            ctx,
        )


@pytest.mark.asyncio
async def test_rpc_send_fixes_workspace_and_rejects_subsequent_changes(rpc_ctx):
    ctx, tmp_path = rpc_ctx
    ws_dir = tmp_path / "project_x"
    ws_dir.mkdir()

    create_res = await conversation_create(
        {"title": "会话", "workspace_path": str(ws_dir)},
        ctx,
    )
    conv_id = create_res["conversation"].id

    # 发送第一条消息
    send_res = await conversation_send(
        {"conversation_id": conv_id, "content": "你好"},
        ctx,
    )
    assert send_res["conversation_id"] == conv_id

    # 校验已被固定
    get_res = await conversation_get({"conversation_id": conv_id}, ctx)
    assert get_res["conversation"].workspace_fixed is True
    assert get_res["conversation"].workspace_path == str(ws_dir.resolve())

    # 尝试修改工作区，RPC 拒绝
    with pytest.raises(JsonRpcError, match="会话工作区已固定"):
        await conversation_set_workspace(
            {"conversation_id": conv_id, "workspace_path": None},
            ctx,
        )
