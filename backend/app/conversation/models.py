"""会话持久化使用的数据结构。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.types import Message


class Conversation(BaseModel):
    """一个可恢复的本地聊天会话。"""

    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = Field(default=0, ge=0)
    # 用户绑定的项目目录（绝对路径；None 表示 No project）。
    workspace_path: str | None = None
    # 绑定是否已固定（第一条消息接受后永久为 True）。
    workspace_fixed: bool = False
    # 绑定目录当前在磁盘上是否可用（No project 永远为 True）。
    workspace_available: bool = True


class ConversationMessageRecord(BaseModel):
    """带会话内稳定序号的原始消息记录。"""

    model_config = ConfigDict(extra="forbid", frozen=True)

    sequence: int = Field(ge=0)
    message: Message
    created_at: datetime


__all__ = ["Conversation", "ConversationMessageRecord"]
