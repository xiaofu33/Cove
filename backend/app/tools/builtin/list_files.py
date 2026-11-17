"""工作区文件列表工具。"""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from app.models.types import ToolDefinition
from app.tools.hooks import ToolExecutionContext

from ..base import BaseTool
from ._workspace import resolve_workspace_path, workspace_root_path

MAX_LISTED_FILES = 200


class ListFilesTool(BaseTool):
    def __init__(self, workspace_root: str | Path | None = None) -> None:
        self._workspace_root = workspace_root_path(workspace_root)

    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            name="list_files",
            description="List files recursively inside the local workspace.",
            parameters={
                "type": "object",
                "properties": {
                    "directory": {
                        "type": "string",
                        "description": (
                            "Optional subdirectory relative to the workspace."
                        ),
                        "default": ".",
                    }
                },
                "additionalProperties": False,
            },
            strict=False,
        )

    async def execute(self, arguments: dict[str, Any]) -> dict[str, Any]:
        return await self._execute_in_root(self._workspace_root, arguments)

    async def execute_with_context(
        self,
        arguments: dict[str, Any],
        context: ToolExecutionContext,
    ) -> dict[str, Any]:
        root = context.workspace_root or self._workspace_root
        return await self._execute_in_root(root, arguments)

    async def _execute_in_root(
        self,
        workspace_root: Path,
        arguments: dict[str, Any],
    ) -> dict[str, Any]:
        directory = arguments.get("directory", ".")
        if not isinstance(directory, str):
            raise ValueError("'directory' must be a string")

        target = resolve_workspace_path(
            workspace_root,
            directory,
            allow_root=True,
        )
        files = await asyncio.to_thread(
            _list_workspace_files,
            workspace_root,
            target,
        )
        return {
            "directory": (target.relative_to(workspace_root).as_posix() or "."),
            "files": files[:MAX_LISTED_FILES],
            "count": min(len(files), MAX_LISTED_FILES),
            "truncated": len(files) > MAX_LISTED_FILES,
        }


def _list_workspace_files(workspace_root: Path, directory: Path) -> list[str]:
    if not directory.is_dir():
        raise ValueError("directory does not exist or is not a directory")

    files: list[str] = []
    for entry in directory.rglob("*"):
        if entry.is_symlink() or not entry.is_file():
            continue
        resolved = entry.resolve()
        try:
            relative = resolved.relative_to(workspace_root)
        except ValueError:
            continue
        files.append(relative.as_posix())
    return sorted(files)
