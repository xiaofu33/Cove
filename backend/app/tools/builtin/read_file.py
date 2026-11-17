"""仅允许读取 Vesta 工作区的 UTF-8 文本工具。"""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from app.models.types import ToolDefinition
from app.tools.hooks import ToolExecutionContext

from ..base import BaseTool
from ._workspace import resolve_workspace_path, workspace_root_path


class ReadFileTool(BaseTool):
    def __init__(self, workspace_root: str | Path | None = None) -> None:
        self._workspace_root = workspace_root_path(workspace_root)

    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="read_file",
            description="Read a UTF-8 text file inside the local workspace.",
            parameters={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Path relative to the workspace.",
                    }
                },
                "required": ["path"],
                "additionalProperties": False,
            },
            strict=True,
        )

    async def execute(self, arguments: dict[str, Any]) -> str:
        return await self._execute_in_root(self._workspace_root, arguments)

    async def execute_with_context(
        self,
        arguments: dict[str, Any],
        context: ToolExecutionContext,
    ) -> str:
        root = context.workspace_root or self._workspace_root
        return await self._execute_in_root(root, arguments)

    async def _execute_in_root(
        self,
        workspace_root: Path,
        arguments: dict[str, Any],
    ) -> str:
        relative_path = arguments.get("path")
        if not isinstance(relative_path, str) or not relative_path:
            raise ValueError("'path' must be a non-empty string")
        target = resolve_workspace_path(workspace_root, relative_path)
        return await asyncio.to_thread(_read_utf8_file, target)


def _read_utf8_file(path: Path) -> str:
    if not path.is_file():
        raise FileNotFoundError(f"file does not exist: {path.name}")
    return path.read_text(encoding="utf-8")
