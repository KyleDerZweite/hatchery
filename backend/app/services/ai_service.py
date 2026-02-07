"""
AI Service - Unified AI integration for modpack operations.

This service provides:
1. Low-level task helpers (clean_name, enhance_description, etc.)
2. High-level modpack generation (select_mods, generate_quest_outline)

Security considerations:
- Minimal data sent to AI (only what's necessary)
- Input validation and size limits
- No secrets in prompts
- Structured logging for audit
"""

from __future__ import annotations

import json
import re
from enum import Enum
from typing import Any

import structlog
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.core.config import settings
from app.core.constants import DEFAULT_MOD_SLUGS

logger = structlog.get_logger()


class AITask(str, Enum):
    """Types of AI tasks - determines what minimal data is sent."""

    CLEAN_NAME = "clean_name"
    ENHANCE_DESCRIPTION = "enhance_description"
    DETECT_MODLOADER = "detect_modloader"
    SUGGEST_JAVA_VERSION = "suggest_java_version"
    FIX_PARSE_ERROR = "fix_parse_error"
    SELECT_MODS = "select_mods"
    GENERATE_QUESTS = "generate_quests"


class AIResponse(BaseModel):
    """Response from AI service."""

    success: bool
    result: str | None = None
    error: str | None = None
    tokens_used: int | None = None


_SYSTEM_PROMPT_MOD_SELECTOR = """You are a Minecraft modpack curator.

Your job is to select mods that:
1. Work well together thematically
2. Provide good gameplay progression
3. Are compatible with each other (avoid known conflicts)
4. Match the user's vision for the pack

When selecting mods, consider:
- Core mods that define the pack's identity
- Support mods that enhance gameplay
- Quality-of-life mods
- Performance and optimization mods

Output valid JSON with your selections and reasoning."""

_SYSTEM_PROMPT_QUEST = """You are a Minecraft modpack quest designer.

You create engaging questlines that:
1. Guide players through mod progression
2. Tell a cohesive story
3. Use actual items from the specified mods
4. Balance difficulty appropriately

When generating quests, ONLY use item IDs from the provided mod list.
Item IDs follow the format: "modid:item_name" (e.g., "create:andesite_alloy").

Output valid JSON matching the requested schema exactly."""

_SYSTEM_PROMPT_GENERAL = """You are a helpful assistant for Minecraft server configuration. 
Give minimal, direct responses. Never include sensitive information."""


_TASK_PROMPTS: dict[AITask, str] = {
    AITask.CLEAN_NAME: """Clean this modpack name. Remove version numbers, underscores, dashes, and formatting artifacts. Return ONLY the cleaned name, nothing else.

Input: {input_text}""",
    AITask.ENHANCE_DESCRIPTION: """Write a brief 1-2 sentence description for this Minecraft modpack. Be concise and informative. Return ONLY the description.

Modpack name: {input_text}
{context}""",
    AITask.DETECT_MODLOADER: """What modloader does this modpack use? Respond with ONLY one word: forge, fabric, neoforge, quilt, or unknown.

Modpack info: {input_text}""",
    AITask.SUGGEST_JAVA_VERSION: """What Java version is needed for Minecraft {context}? Respond with ONLY the number (8, 11, 16, 17, or 21).

Additional info: {input_text}""",
    AITask.FIX_PARSE_ERROR: """This modpack config has an error. Extract the key information and return as JSON with these fields only: name, minecraft_version, modloader (forge/fabric/neoforge/quilt), modloader_version. Return ONLY valid JSON.

Config snippet: {input_text}""",
}


class AIService:
    """
    Unified AI service using OpenRouter (OpenAI-compatible API).

    Provides both low-level convenience methods and high-level
    modpack generation functions.
    """

    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        """Get or create OpenAI client configured for OpenRouter."""
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                default_headers={
                    "HTTP-Referer": "https://github.com/hatchery",
                    "X-Title": "Hatchery",
                },
            )
        return self._client

    async def close(self) -> None:
        """Close the OpenAI client."""
        if self._client:
            await self._client.close()
            self._client = None

    @property
    def is_enabled(self) -> bool:
        """Check if AI service is properly configured."""
        return settings.ai_enabled

    async def _chat(
        self,
        prompt: str,
        system_prompt: str = _SYSTEM_PROMPT_GENERAL,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> str | None:
        """
        Send a chat completion and return the assistant's text.

        Returns None on error or if AI is disabled.
        """
        if not self.is_enabled:
            return None

        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=settings.openrouter_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature or settings.ai_temperature,
                max_tokens=max_tokens or settings.ai_max_tokens,
            )

            content = response.choices[0].message.content
            if content:
                logger.debug(
                    "ai_chat_completed",
                    model=settings.openrouter_model,
                    tokens_used=response.usage.total_tokens if response.usage else None,
                )
            return content

        except Exception as e:
            logger.error("ai_chat_error", error=str(e))
            return None

    async def _chat_json(
        self,
        prompt: str,
        system_prompt: str = _SYSTEM_PROMPT_GENERAL,
        temperature: float = 0.3,
    ) -> dict[str, Any]:
        """
        Send a chat request expecting JSON-only output.

        Returns empty dict on failure.
        """
        json_system = system_prompt + (
            "\n\nYou must respond with valid JSON only. "
            "Do not include markdown code blocks or any other text. "
            "Only output the raw JSON object."
        )

        result = await self._chat(
            prompt=prompt,
            system_prompt=json_system,
            temperature=temperature,
        )

        if not result:
            return {}

        return self._parse_json_response(result)

    def _parse_json_response(self, text: str) -> dict[str, Any]:
        """Parse JSON from AI response, handling markdown fences."""
        text = text.strip()

        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)

        brace = text.find("{")
        bracket = text.find("[")

        if brace == -1 and bracket == -1:
            return {}

        if brace == -1:
            start_c, end_c, start_i = "[", "]", bracket
        elif bracket == -1 or brace < bracket:
            start_c, end_c, start_i = "{", "}", brace
        else:
            start_c, end_c, start_i = "[", "]", bracket

        depth = 0
        end_i = start_i
        in_str = False
        esc = False

        for i, ch in enumerate(text[start_i:], start_i):
            if esc:
                esc = False
                continue
            if ch == "\\":
                esc = True
                continue
            if ch == '"' and not esc:
                in_str = not in_str
                continue
            if in_str:
                continue
            if ch == start_c:
                depth += 1
            elif ch == end_c:
                depth -= 1
                if depth == 0:
                    end_i = i
                    break

        text = text[start_i : end_i + 1]
        text = re.sub(r",(\s*[}\]])", r"\1", text)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {}

    async def select_mods(
        self,
        candidate_descriptions: list[str],
        user_prompt: str,
        mc_version: str,
        loader: str,
        template_names: list[str] | None = None,
        target_count: int = 50,
    ) -> dict[str, Any]:
        """
        Ask the AI to pick the best mods from a candidate list.

        Returns dict with "selected_slugs" and "reasoning".
        """
        if not self.is_enabled:
            return {
                "selected_slugs": list(DEFAULT_MOD_SLUGS),
                "reasoning": "AI disabled - using default mods only",
            }

        templates = template_names or ["tech"]
        template_label = ", ".join(templates[:3])
        candidate_block = "\n".join(candidate_descriptions[:100])

        prompt = f"""Select mods for a Minecraft modpack.

USER REQUEST: {user_prompt[:500]}
MINECRAFT VERSION: {mc_version}
MOD LOADER: {loader}
TARGET MOD COUNT: {target_count}
TEMPLATE STYLES: {template_label}

The pack should blend the following template styles: {template_label}.
Prioritise mods that complement multiple chosen styles where possible.

AVAILABLE MODS (search results):
{candidate_block}

Select the best {target_count} mods for this pack. Consider:
1. Must match the user's theme and vision
2. Include essential core mods
3. Add quality-of-life improvements
4. Avoid redundant mods

Output JSON:
{{
    "selected_slugs": ["mod_slug_1", "mod_slug_2"],
    "reasoning": "Brief explanation of your selections"
}}"""

        raw = await self._chat_json(
            prompt=prompt,
            system_prompt=_SYSTEM_PROMPT_MOD_SELECTOR,
        )

        if not raw:
            return {
                "selected_slugs": list(DEFAULT_MOD_SLUGS),
                "reasoning": "AI response parsing failed",
            }

        selected = raw.get("selected_slugs", [])

        for slug in DEFAULT_MOD_SLUGS:
            if slug not in selected:
                selected.append(slug)

        logger.info(
            "ai_mods_selected",
            count=len(selected),
            mc_version=mc_version,
            loader=loader,
        )

        return {
            "selected_slugs": selected[: target_count + len(DEFAULT_MOD_SLUGS)],
            "reasoning": str(raw.get("reasoning", ""))[:1000],
        }

    async def generate_quest_outline(
        self,
        mod_descriptions: list[str],
        user_prompt: str,
        template_names: list[str] | None = None,
        chapter_count: int = 3,
        quests_per_chapter: int = 5,
    ) -> dict[str, Any]:
        """
        Ask the AI to generate a quest storyline.

        Returns parsed JSON dict matching the StoryOutline schema.
        """
        if not self.is_enabled:
            return {
                "title": "Default Questline",
                "description": "Complete quests to progress",
                "chapters": [],
            }

        templates = template_names or ["tech"]
        template_label = ", ".join(templates[:3])
        mod_block = "\n".join(mod_descriptions[:50])

        prompt = f"""Create a quest storyline for a Minecraft modpack.

THEME: {user_prompt[:500]}
TEMPLATE STYLES: {template_label}

The quest line should weave together the following template styles: {template_label}.

AVAILABLE MODS AND ITEMS:
{mod_block}

Generate exactly {chapter_count} chapters with {quests_per_chapter} quests each.

Output JSON in this exact format:
{{
    "title": "Pack Story Title",
    "description": "Brief description of the story",
    "chapters": [
        {{
            "title": "Chapter 1: Getting Started",
            "filename": "getting_started",
            "icon": "minecraft:crafting_table",
            "quests": [
                {{
                    "title": "Quest Title",
                    "description": "What to do and why",
                    "icon": "modid:item_name",
                    "tasks": [
                        {{"type": "item", "item": "modid:item_name", "count": 1}}
                    ],
                    "rewards": [
                        {{"type": "item", "item": "modid:reward_item", "count": 1}}
                    ]
                }}
            ]
        }}
    ]
}}

IMPORTANT:
- Only use item IDs from the mods listed above
- First quest of each chapter should have no dependencies
- Later quests should reference earlier ones
- Create a logical progression through mod tiers"""

        raw = await self._chat_json(
            prompt=prompt,
            system_prompt=_SYSTEM_PROMPT_QUEST,
            temperature=0.7,
        )

        if not raw:
            return {
                "title": "Default Questline",
                "description": "Complete quests to progress",
                "chapters": [],
            }

        logger.info(
            "ai_quests_generated",
            chapters=len(raw.get("chapters", [])),
            total_quests=sum(len(c.get("quests", [])) for c in raw.get("chapters", [])),
        )

        return raw

    async def clean_name(self, raw_name: str) -> str | None:
        """Clean a modpack name. Returns None if AI unavailable."""
        prompt = _TASK_PROMPTS[AITask.CLEAN_NAME].format(input_text=raw_name[:500])
        return await self._chat(prompt)

    async def enhance_description(
        self,
        name: str,
        existing_desc: str | None = None,
        modloader: str | None = None,
    ) -> str | None:
        """Generate or enhance a description. Returns None if AI unavailable."""
        context_parts = []
        if existing_desc:
            context_parts.append(f"existing: {existing_desc[:200]}")
        if modloader:
            context_parts.append(f"modloader: {modloader}")

        context = "\n".join(context_parts)
        prompt = _TASK_PROMPTS[AITask.ENHANCE_DESCRIPTION].format(
            input_text=name[:200],
            context=context,
        )
        return await self._chat(prompt)

    async def detect_modloader(self, hints: str) -> str | None:
        """Detect modloader from hints. Returns None if AI unavailable."""
        prompt = _TASK_PROMPTS[AITask.DETECT_MODLOADER].format(input_text=hints[:500])
        result = await self._chat(prompt)
        if result:
            result = result.lower().strip()
            if result in ("forge", "fabric", "neoforge", "quilt"):
                return result
        return None

    async def suggest_java_version(
        self,
        minecraft_version: str,
        additional_info: str = "",
    ) -> int | None:
        """Suggest Java version. Returns None if AI unavailable."""
        prompt = _TASK_PROMPTS[AITask.SUGGEST_JAVA_VERSION].format(
            input_text=additional_info[:200] or "No additional info",
            context=minecraft_version,
        )
        result = await self._chat(prompt)
        if result:
            try:
                return int(result.strip())
            except ValueError:
                pass
        return None

    async def fix_parse_error(self, config_snippet: str) -> dict[str, Any] | None:
        """Attempt to extract info from malformed config."""
        prompt = _TASK_PROMPTS[AITask.FIX_PARSE_ERROR].format(input_text=config_snippet[:1000])
        result = await self._chat(prompt)
        if result:
            return self._parse_json_response(result)
        return None


ai_service = AIService()


def get_ai_service() -> AIService:
    return ai_service
