"""
Quest service for generating SNBT quest files for FTB Quests.

Generates SNBT-format quest files that can be imported into FTB Quests.
SNBT (Stringified NBT) is Minecraft's text format for NBT data.

Security considerations:
- All input validated through typed parameters
- No arbitrary code execution
- Output is plain text (SNBT format)
"""

from __future__ import annotations

import secrets
from typing import Any

import structlog

logger = structlog.get_logger()


def _hex_id() -> str:
    """Generate a random 16-character hex ID for FTB Quests."""
    return secrets.token_hex(8).upper()


class SNBTWriter:
    """
    Generates SNBT-format strings for FTB Quests.

    SNBT is Minecraft's stringified NBT format used for data files.
    This writer handles proper escaping and formatting.
    """

    def __init__(self, indent: str = "\t") -> None:
        self.indent = indent

    def format_value(self, value: Any, depth: int = 0) -> str:
        """Format a Python value as SNBT."""
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, int):
            return str(value)
        if isinstance(value, float):
            return f"{value}d"
        if isinstance(value, str):
            escaped = value.replace("\\", "\\\\").replace('"', '\\"')
            return f'"{escaped}"'
        if isinstance(value, list):
            return self._format_list(value, depth)
        if isinstance(value, dict):
            return self.format_dict(value, depth)
        return str(value)

    def _format_list(self, values: list[Any], depth: int) -> str:
        """Format a list as SNBT array."""
        if not values:
            return "[ ]"

        items = [self.format_value(item, depth + 1) for item in values]

        if all(isinstance(v, str) for v in values) and len(values) <= 3:
            return "[" + ", ".join(items) + "]"

        prefix = self.indent * (depth + 1)
        formatted = "[\n"
        for item in items:
            formatted += f"{prefix}{item}\n"
        formatted += self.indent * depth + "]"
        return formatted

    def format_dict(self, data: dict[str, Any], depth: int = 0) -> str:
        """Format a dict as SNBT compound."""
        if not data:
            return "{ }"

        prefix = self.indent * (depth + 1)
        closing = self.indent * depth
        lines = ["{\n"]

        for key, val in data.items():
            lines.append(f"{prefix}{key}: {self.format_value(val, depth + 1)}\n")

        lines.append(f"{closing}}}")
        return "".join(lines)


def _task_dict(task: dict[str, Any]) -> dict[str, Any]:
    """Convert a task definition to SNBT-compatible dict."""
    result: dict[str, Any] = {
        "id": str(task.get("id") or _hex_id()),
        "type": str(task.get("type", "item")),
    }

    if task.get("title"):
        result["title"] = str(task["title"])[:200]

    task_type = task.get("type", "item")
    if task_type == "item" and task.get("item"):
        result["item"] = str(task["item"])[:256]
        if task.get("count", 1) > 1:
            result["count"] = f"{int(task['count'])}L"
    elif task_type == "kill" and task.get("entity"):
        result["entity"] = str(task["entity"])[:256]
        result["value"] = int(task.get("kill_count", 1))
    elif task_type == "checkmark":
        pass

    return result


def _reward_dict(reward: dict[str, Any]) -> dict[str, Any]:
    """Convert a reward definition to SNBT-compatible dict."""
    result: dict[str, Any] = {
        "id": str(reward.get("id") or _hex_id()),
        "type": str(reward.get("type", "item")),
    }

    reward_type = reward.get("type", "item")
    if reward_type == "item" and reward.get("item"):
        result["item"] = str(reward["item"])[:256]
        if reward.get("count", 1) > 1:
            result["count"] = int(reward["count"])
    elif reward_type == "xp":
        result["xp"] = int(reward.get("xp", 100))

    return result


def _quest_dict(quest: dict[str, Any], index: int) -> dict[str, Any]:
    """Convert a quest definition to SNBT-compatible dict."""
    quest_id = str(quest.get("id") or _hex_id())

    columns = 3
    spacing_x = 2.5
    spacing_y = 2.0
    row = index // columns
    col = index % columns

    result: dict[str, Any] = {
        "id": quest_id,
        "x": (col - columns // 2) * spacing_x,
        "y": row * spacing_y,
    }

    if quest.get("title"):
        result["title"] = str(quest["title"])[:200]

    desc = quest.get("description")
    if desc:
        if isinstance(desc, str):
            result["description"] = [str(desc)[:500]]
        else:
            result["description"] = [str(d)[:500] for d in desc[:5]]

    if quest.get("icon"):
        result["icon"] = str(quest["icon"])[:256]

    if quest.get("dependencies"):
        result["dependencies"] = [str(d) for d in quest["dependencies"][:10]]

    if index == 0:
        result["shape"] = "hexagon"
        result["size"] = 1.5

    tasks = quest.get("tasks") or [{"type": "checkmark", "title": "Complete"}]
    result["tasks"] = [_task_dict(t) for t in tasks[:10]]

    rewards = quest.get("rewards") or [{"type": "xp", "xp": 100}]
    result["rewards"] = [_reward_dict(r) for r in rewards[:5]]

    return result


def generate_quest_files(outline: dict[str, Any]) -> dict[str, str]:
    """
    Convert an AI-generated outline dict into SNBT file contents.

    Args:
        outline: Dict with "title", "description", "chapters" (each with "quests").
                Example:
                {
                    "title": "My Pack Story",
                    "description": "A journey through technology",
                    "chapters": [
                        {
                            "title": "Getting Started",
                            "filename": "getting_started",
                            "icon": "minecraft:crafting_table",
                            "quests": [
                                {
                                    "title": "First Steps",
                                    "description": "Craft your first item",
                                    "icon": "minecraft:stick",
                                    "tasks": [{"type": "item", "item": "minecraft:stick", "count": 1}],
                                    "rewards": [{"type": "xp", "xp": 100}]
                                }
                            ]
                        }
                    ]
                }

    Returns:
        Dict mapping relative filename -> SNBT string content.
        Example: {"chapters/getting_started.snbt": "...", "index.snbt": "..."}
    """
    writer = SNBTWriter()
    files: dict[str, str] = {}
    chapter_ids: list[str] = []

    for ch_index, ch in enumerate(outline.get("chapters", [])):
        chapter_id = _hex_id()
        chapter_ids.append(chapter_id)

        quests_data = ch.get("quests", [])
        quest_dicts = [_quest_dict(q, i) for i, q in enumerate(quests_data[:20])]

        chapter_dict: dict[str, Any] = {
            "default_hide_dependency_lines": False,
            "default_quest_shape": "",
            "filename": str(ch.get("filename", f"chapter_{ch_index + 1}"))[:100],
            "group": "",
            "icon": str(ch.get("icon", "minecraft:book"))[:256],
            "id": chapter_id,
            "order_index": ch_index,
            "progression_mode": "flexible",
            "quest_links": [],
            "quests": quest_dicts,
            "title": str(ch.get("title", f"Chapter {ch_index + 1}"))[:200],
        }

        fname = chapter_dict["filename"]
        files[f"chapters/{fname}.snbt"] = writer.format_dict(chapter_dict)

    index_dict: dict[str, Any] = {
        "default_chapter": chapter_ids[0] if chapter_ids else "",
        "chapters": chapter_ids,
    }
    files["index.snbt"] = writer.format_dict(index_dict)

    logger.info(
        "quest_files_generated",
        chapters=len(chapter_ids),
        total_quests=count_quests(outline),
    )

    return files


def count_quests(outline: dict[str, Any]) -> int:
    """Count total quests in an outline dict."""
    return sum(len(ch.get("quests", [])) for ch in outline.get("chapters", []))
