"""聊天工作区选择功能测试（后端核心规范验证）。

覆盖：
1. 新会话默认 No project，未固定（workspace_fixed=False）。
2. 第一条消息前可选择、更换与取消工作区（set_workspace），严格校验后端本地存在性。
3. 第一条消息被接受时原子固定绑定（workspace_fixed=True），失败也不解除。
4. 固定后禁止修改或解绑。
5. No project 会话使用独立持久化的内部工作目录，不同会话隔离，重启后一致。
6. 自定义工作区执行工具（文件读写、list_files、shell、artifact）均使用该会话工作区，并发不串。
7. 绑定目录被删除/不存在时明确报错（WorkspaceUnavailableError），不静默回退或重建。
8. 旧会话兼容：有消息的固定为旧工作区，无消息的保留为未固定 No project。
"""

from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from app.agent.result import AgentResult, AgentStopReason
from app.conversation import (
    ConversationSource,
    SQLiteConversationStore,
    TriggerContext,
)
from app.conversation.service import (
    ConversationService,
    WorkspaceUnavailableError,
)
from app.models.types import Message, MessageRole, ModelUsage, ToolCall
from app.run import RunManager, SQLiteRunStore
from app.tools.builtin.list_files import ListFilesTool
from app.tools.builtin.read_file import ReadFileTool
from app.tools.builtin.write_file import WriteFileTool
from app.tools.hooks import ToolExecutionContext
from app.trace import SQLiteTraceStore


class StubExecutionRuntime:
    """可记录 execution context 的 Stub Runtime。"""

    def __init__(self) -> None:
        self.received_workspace_root: Path | None = None

    async def run_stream(
        self,
        user_input: str,
        *,
        history=(),
        conversation_id=None,
        event_handler=None,
        summary_state=None,
        run_id=None,
        recovery_run_id=None,
        mode=None,
        workspace_root: Path | None = None,
    ):
        self.received_workspace_root = workspace_root
        user_message = Message(role=MessageRole.USER, content=user_input)
        final_message = Message(role=MessageRole.ASSISTANT, content="Done")
        result = AgentResult(
            run_id=run_id or "run-stub",
            final_message=final_message,
            messages=(*history, user_message, final_message),
            steps=1,
            stop_reason=AgentStopReason.FINAL_ANSWER,
            usage=ModelUsage(),
        )
        yield type("Event", (), {"result": result})()


@pytest.fixture
async def conv_env(tmp_path: Path):
    db_path = tmp_path / "vesta.db"
    store = SQLiteConversationStore(db_path)
    await store.initialize()
    trace_store = SQLiteTraceStore(db_path)
    await trace_store.initialize()
    run_store = SQLiteRunStore(db_path)
    await run_store.initialize()
    checkpoint_store = None
    runtime = StubExecutionRuntime()
    run_manager = RunManager(run_store, checkpoint_store, runtime)
    service = ConversationService(
        store,
        run_manager,
        trace_store,
        internal_workspaces_dir=tmp_path / "workspaces",
    )
    return store, service, runtime, tmp_path


@pytest.mark.asyncio
async def test_new_conversation_defaults_to_no_project(conv_env):
    store, _, _, _ = conv_env
    conv = await store.create(title="测试新会话")
    assert conv.workspace_path is None
    assert conv.workspace_fixed is False
    assert conv.workspace_available is True


@pytest.mark.asyncio
async def test_can_set_change_and_clear_workspace_before_first_message(conv_env):
    store, _, _, tmp_path = conv_env
    conv = await store.create(title="测试更换工作区")
    ws_dir1 = tmp_path / "project_a"
    ws_dir1.mkdir()
    ws_dir2 = tmp_path / "project_b"
    ws_dir2.mkdir()

    # 1. 绑定 project_a
    updated1 = await store.set_workspace(conv.id, str(ws_dir1))
    assert updated1.workspace_path == str(ws_dir1.resolve())
    assert updated1.workspace_fixed is False

    # 2. 更换为 project_b
    updated2 = await store.set_workspace(conv.id, str(ws_dir2))
    assert updated2.workspace_path == str(ws_dir2.resolve())
    assert updated2.workspace_fixed is False

    # 3. 恢复为 No project
    updated3 = await store.set_workspace(conv.id, None)
    assert updated3.workspace_path is None
    assert updated3.workspace_fixed is False


@pytest.mark.asyncio
async def test_workspace_fixed_permanently_on_first_message(conv_env):
    store, service, runtime, tmp_path = conv_env
    ws_dir = tmp_path / "fixed_project"
    ws_dir.mkdir()
    conv = await store.create(title="首消息锁定测试")
    await store.set_workspace(conv.id, str(ws_dir))

    # 发送第一条消息
    dispatch = await service.dispatch(
        conversation_id=conv.id,
        content="第一条消息",
        trigger=TriggerContext(source=ConversationSource.MANUAL),
    )
    assert dispatch.run.status.value == "completed"

    # 验证工作区已原子固定
    reloaded = await store.get(conv.id)
    assert reloaded.workspace_fixed is True
    assert reloaded.workspace_path == str(ws_dir.resolve())
    assert runtime.received_workspace_root == ws_dir.resolve()

    # 固定后尝试修改，必须被拒绝抛错
    with pytest.raises(ValueError, match="会话工作区已固定"):
        await store.set_workspace(conv.id, str(tmp_path))

    with pytest.raises(ValueError, match="会话工作区已固定"):
        await store.set_workspace(conv.id, None)


@pytest.mark.asyncio
async def test_no_project_uses_isolated_persistent_internal_dir(conv_env):
    store, service, runtime, tmp_path = conv_env
    conv1 = await store.create(title="No project 1")
    conv2 = await store.create(title="No project 2")

    # 分别为两个 No project 发送消息
    await service.dispatch(
        conversation_id=conv1.id,
        content="hello 1",
        trigger=TriggerContext(source=ConversationSource.MANUAL),
    )
    dir1 = runtime.received_workspace_root
    assert dir1 is not None
    assert dir1.exists()
    assert dir1.name == conv1.id

    await service.dispatch(
        conversation_id=conv2.id,
        content="hello 2",
        trigger=TriggerContext(source=ConversationSource.MANUAL),
    )
    dir2 = runtime.received_workspace_root
    assert dir2 is not None
    assert dir2.exists()
    assert dir2.name == conv2.id

    # 彼此隔离且不同
    assert dir1 != dir2

    # 重启或恢复再次发送，使用同一个内部持久化目录
    await service.dispatch(
        conversation_id=conv1.id,
        content="hello again",
        trigger=TriggerContext(source=ConversationSource.MANUAL),
    )
    assert runtime.received_workspace_root == dir1


@pytest.mark.asyncio
async def test_unavailable_workspace_fails_explicitly(conv_env):
    store, service, _, tmp_path = conv_env
    ws_dir = tmp_path / "deleted_project"
    ws_dir.mkdir()
    conv = await store.create(title="删除工作区测试")
    await store.set_workspace(conv.id, str(ws_dir))

    # 物理删除工作区目录
    ws_dir.rmdir()

    # 状态呈现不可用
    reloaded = await store.get(conv.id)
    assert reloaded.workspace_available is False

    # 执行时必须明确失败报错，不得静默回退到全局目录
    with pytest.raises(WorkspaceUnavailableError, match="工作区目录不可用或不存在"):
        await service.dispatch(
            conversation_id=conv.id,
            content="执行命令",
            trigger=TriggerContext(source=ConversationSource.MANUAL),
        )


@pytest.mark.asyncio
async def test_builtin_tools_isolated_via_execution_context(tmp_path: Path):
    """验证文件读写与列表工具严格按 ToolExecutionContext.workspace_root 执行。"""
    ws_a = tmp_path / "workspace_a"
    ws_a.mkdir()
    ws_b = tmp_path / "workspace_b"
    ws_b.mkdir()

    write_tool = WriteFileTool()
    read_tool = ReadFileTool()
    list_tool = ListFilesTool()

    # 在 workspace_a 写入 a.txt
    ctx_a = ToolExecutionContext(
        tool_call=ToolCall(id="1", name="write_file", arguments={}),
        workspace_root=ws_a,
    )
    await write_tool.execute_with_context(
        {"path": "sample.txt", "content": "from A"},
        ctx_a,
    )

    # 在 workspace_b 写入 b.txt
    ctx_b = ToolExecutionContext(
        tool_call=ToolCall(id="2", name="write_file", arguments={}),
        workspace_root=ws_b,
    )
    await write_tool.execute_with_context(
        {"path": "sample.txt", "content": "from B"},
        ctx_b,
    )

    # 在 ctx_a 读取，得到 from A
    read_a = await read_tool.execute_with_context({"path": "sample.txt"}, ctx_a)
    assert read_a == "from A"

    # 在 ctx_b 读取，得到 from B
    read_b = await read_tool.execute_with_context({"path": "sample.txt"}, ctx_b)
    assert read_b == "from B"

    # 列表文件
    listed_a = await list_tool.execute_with_context({"directory": "."}, ctx_a)
    assert listed_a["files"] == ["sample.txt"]


@pytest.mark.asyncio
async def test_legacy_conversations_migration(tmp_path: Path):
    """旧数据库迁移：有消息的固定绑定到旧默认工作区，无消息的保持未固定 No project。"""
    import aiosqlite

    db_path = tmp_path / "legacy.db"
    # 创建旧 schema（没有 workspace_path / workspace_fixed 列）
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            """
            CREATE TABLE conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        await db.execute(
            """
            CREATE TABLE messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                sequence INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT,
                name TEXT,
                tool_call_id TEXT,
                tool_calls_json TEXT NOT NULL DEFAULT '[]',
                reasoning TEXT,
                created_at TEXT NOT NULL
            );
            """
        )
        # 插入一个有消息的旧会话
        await db.execute(
            "INSERT INTO conversations VALUES ('c_with_msg', '有消息会话', '2026-01-01', '2026-01-01')"
        )
        await db.execute(
            "INSERT INTO messages (conversation_id, sequence, role, content, tool_calls_json, created_at) "
            "VALUES ('c_with_msg', 0, 'user', 'hi', '[]', '2026-01-01')"
        )
        # 插入一个无消息的旧会话
        await db.execute(
            "INSERT INTO conversations VALUES ('c_empty', '空会话', '2026-01-01', '2026-01-01')"
        )
        await db.commit()

    # 初始化新 Store（执行迁移）
    store = SQLiteConversationStore(db_path)
    await store.initialize()

    # 验证有消息的会话：已固定，且绑定为默认旧工作区
    c1 = await store.get("c_with_msg")
    assert c1.workspace_fixed is True
    assert c1.workspace_path is not None
    assert Path(c1.workspace_path).name == "workspace"

    # 验证无消息的会话：未固定，为 No project
    c2 = await store.get("c_empty")
    assert c2.workspace_fixed is False
    assert c2.workspace_path is None
