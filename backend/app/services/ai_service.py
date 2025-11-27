"""
AI Service - Flexible AI integration for optional enhancement and error recovery.

This service is completely opt-in and supports any OpenAI-compatible API endpoint.
Minimal data is sent to the AI - only what's necessary for the specific task.
"""

import json
from enum import Enum
from typing import Any

import httpx
from pydantic import BaseModel


class AITask(str, Enum):
    """Types of AI tasks - determines what minimal data is sent."""

    CLEAN_NAME = "clean_name"
    ENHANCE_DESCRIPTION = "enhance_description"
    DETECT_MODLOADER = "detect_modloader"
    SUGGEST_JAVA_VERSION = "suggest_java_version"
    FIX_PARSE_ERROR = "fix_parse_error"


class AIRequest(BaseModel):
    """Request to the AI service - minimal data only."""

    task: AITask
    # Only the specific data needed for the task
    input_text: str
    # Optional context hints (e.g., "minecraft_version": "1.20.1")
    context: dict[str, str] = {}


class AIResponse(BaseModel):
    """Response from AI service."""

    success: bool
    result: str | None = None
    error: str | None = None
    tokens_used: int | None = None


class AIConfig(BaseModel):
    """User-provided AI configuration."""

    enabled: bool = False
    api_endpoint: str = ""  # e.g., "https://openrouter.ai/api/v1", "http://localhost:11434/v1"
    api_key: str = ""  # Optional for local models
    model: str = ""  # e.g., "google/gemini-flash-1.5", "qwen/qwen-2.5-7b-instruct"
    max_tokens: int = 150  # Keep responses short
    temperature: float = 0.3  # Low temperature for consistent outputs


# Task-specific prompts - minimal and focused
TASK_PROMPTS = {
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
    Flexible AI service supporting any OpenAI-compatible API.

    Supports:
    - OpenRouter (https://openrouter.ai/api/v1)
    - OpenAI (https://api.openai.com/v1)
    - Anthropic via OpenRouter
    - Ollama (http://localhost:11434/v1)
    - Any OpenAI-compatible endpoint
    """

    def __init__(self, config: AIConfig | None = None):
        self.config = config
        self._client: httpx.AsyncClient | None = None

    def configure(self, config: AIConfig) -> None:
        """Update AI configuration."""
        self.config = config
        self._client = None  # Reset client on config change

    @property
    def is_enabled(self) -> bool:
        """Check if AI service is properly configured and enabled."""
        if not self.config or not self.config.enabled:
            return False
        if not self.config.api_endpoint or not self.config.model:
            return False
        return True

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    def _build_prompt(self, request: AIRequest) -> str:
        """Build minimal prompt for the specific task."""
        template = TASK_PROMPTS.get(request.task, "{input_text}")

        # Format context as simple key-value if present
        context_str = ""
        if request.context:
            context_str = "\n".join(f"{k}: {v}" for k, v in request.context.items())

        return template.format(
            input_text=request.input_text[:500],  # Limit input size
            context=context_str,
        )

    async def process(self, request: AIRequest) -> AIResponse:
        """
        Process an AI request with minimal data.

        Returns AIResponse with success=False if AI is disabled or fails.
        """
        if not self.is_enabled:
            return AIResponse(success=False, error="AI service not configured or disabled")

        try:
            client = await self._get_client()
            prompt = self._build_prompt(request)

            # Build request for OpenAI-compatible API
            headers = {"Content-Type": "application/json"}
            if self.config.api_key:
                headers["Authorization"] = f"Bearer {self.config.api_key}"

            # OpenRouter-specific headers (ignored by other providers)
            headers["HTTP-Referer"] = "https://github.com/hatchery"
            headers["X-Title"] = "Hatchery"

            payload = {
                "model": self.config.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant for Minecraft server configuration. Give minimal, direct responses.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": self.config.max_tokens,
                "temperature": self.config.temperature,
            }

            # Ensure endpoint ends properly
            endpoint = self.config.api_endpoint.rstrip("/")
            if not endpoint.endswith("/chat/completions"):
                endpoint = f"{endpoint}/chat/completions"

            response = await client.post(
                endpoint,
                headers=headers,
                json=payload,
            )

            if response.status_code != 200:
                return AIResponse(
                    success=False,
                    error=f"API error: {response.status_code} - {response.text[:200]}",
                )

            data = response.json()

            # Extract response text
            result = None
            tokens_used = None

            if "choices" in data and data["choices"]:
                message = data["choices"][0].get("message", {})
                result = message.get("content", "").strip()

            if "usage" in data:
                tokens_used = data["usage"].get("total_tokens")

            if not result:
                return AIResponse(success=False, error="Empty response from AI")

            return AIResponse(success=True, result=result, tokens_used=tokens_used)

        except httpx.TimeoutException:
            return AIResponse(success=False, error="AI request timed out")
        except Exception as e:
            return AIResponse(success=False, error=f"AI error: {str(e)}")

    # Convenience methods for specific tasks

    async def clean_name(self, raw_name: str) -> str | None:
        """Clean a modpack name. Returns None if AI unavailable."""
        response = await self.process(AIRequest(task=AITask.CLEAN_NAME, input_text=raw_name))
        return response.result if response.success else None

    async def enhance_description(
        self, name: str, existing_desc: str | None = None, modloader: str | None = None
    ) -> str | None:
        """Generate or enhance a description. Returns None if AI unavailable."""
        context = {}
        if existing_desc:
            context["existing"] = existing_desc[:200]
        if modloader:
            context["modloader"] = modloader

        response = await self.process(
            AIRequest(task=AITask.ENHANCE_DESCRIPTION, input_text=name, context=context)
        )
        return response.result if response.success else None

    async def detect_modloader(self, hints: str) -> str | None:
        """Detect modloader from hints. Returns None if AI unavailable."""
        response = await self.process(AIRequest(task=AITask.DETECT_MODLOADER, input_text=hints))
        if response.success and response.result:
            result = response.result.lower().strip()
            if result in ("forge", "fabric", "neoforge", "quilt"):
                return result
        return None

    async def suggest_java_version(
        self, minecraft_version: str, additional_info: str = ""
    ) -> int | None:
        """Suggest Java version. Returns None if AI unavailable."""
        response = await self.process(
            AIRequest(
                task=AITask.SUGGEST_JAVA_VERSION,
                input_text=additional_info or "No additional info",
                context={"minecraft_version": minecraft_version},
            )
        )
        if response.success and response.result:
            try:
                return int(response.result.strip())
            except ValueError:
                pass
        return None

    async def fix_parse_error(self, config_snippet: str) -> dict[str, Any] | None:
        """
        Attempt to extract info from malformed config.
        Returns parsed dict or None if AI unavailable/fails.
        """
        response = await self.process(
            AIRequest(
                task=AITask.FIX_PARSE_ERROR,
                input_text=config_snippet[:1000],  # Limit size
            )
        )
        if response.success and response.result:
            try:
                # Try to parse JSON from response
                result = response.result
                # Handle markdown code blocks if present
                if "```" in result:
                    result = result.split("```")[1]
                    if result.startswith("json"):
                        result = result[4:]
                return json.loads(result.strip())
            except (json.JSONDecodeError, IndexError):
                pass
        return None


# Singleton instance (configured per-request or globally)
ai_service = AIService()


def get_ai_service() -> AIService:
    """Get the AI service instance."""
    return ai_service
