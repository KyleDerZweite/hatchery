"""
AI API endpoints - User configuration and optional AI-assisted operations.

All AI features are opt-in and require user configuration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models import User
from app.services.ai_service import (
    AIConfig,
    AIRequest,
    AITask,
    get_ai_service,
)

router = APIRouter(prefix="/ai", tags=["AI Assistant (Optional)"])


class AIConfigUpdate(BaseModel):
    """Update AI configuration."""

    enabled: bool
    api_endpoint: str  # e.g., "https://openrouter.ai/api/v1"
    api_key: str = ""  # Optional for local models like Ollama
    model: str  # e.g., "google/gemini-flash-1.5-8b", "anthropic/claude-3-haiku"
    max_tokens: int = 150
    temperature: float = 0.3


class AIConfigResponse(BaseModel):
    """Current AI configuration (without sensitive data)."""

    enabled: bool
    api_endpoint: str
    has_api_key: bool
    model: str
    max_tokens: int
    temperature: float


class CleanNameRequest(BaseModel):
    """Request to clean a modpack name."""

    raw_name: str


class EnhanceDescriptionRequest(BaseModel):
    """Request to enhance/generate a description."""

    name: str
    existing_description: str | None = None
    modloader: str | None = None


class DetectModloaderRequest(BaseModel):
    """Request to detect modloader from hints."""

    hints: str  # File names, config snippets, etc.


class SuggestJavaRequest(BaseModel):
    """Request to suggest Java version."""

    minecraft_version: str
    additional_info: str = ""


class FixParseErrorRequest(BaseModel):
    """Request to fix a parse error."""

    config_snippet: str  # The problematic config (truncated)


class AITaskResult(BaseModel):
    """Generic result from an AI task."""

    success: bool
    result: str | dict | None = None
    error: str | None = None
    tokens_used: int | None = None


# Store user-specific AI configs (in production, store in database)
_user_ai_configs: dict[int, AIConfig] = {}


def get_user_ai_config(user_id: int) -> AIConfig | None:
    """Get AI config for a specific user."""
    return _user_ai_configs.get(user_id)


def set_user_ai_config(user_id: int, config: AIConfig) -> None:
    """Set AI config for a specific user."""
    _user_ai_configs[user_id] = config


@router.get("/config", response_model=AIConfigResponse)
async def get_ai_config(current_user: User = Depends(get_current_user)):
    """
    Get current AI configuration for the authenticated user.

    API key is not returned for security.
    """
    config = get_user_ai_config(current_user.id)
    if not config:
        return AIConfigResponse(
            enabled=False,
            api_endpoint="",
            has_api_key=False,
            model="",
            max_tokens=150,
            temperature=0.3,
        )

    return AIConfigResponse(
        enabled=config.enabled,
        api_endpoint=config.api_endpoint,
        has_api_key=bool(config.api_key),
        model=config.model,
        max_tokens=config.max_tokens,
        temperature=config.temperature,
    )


@router.put("/config", response_model=AIConfigResponse)
async def update_ai_config(
    config_update: AIConfigUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update AI configuration for the authenticated user.

    Example configurations:

    **OpenRouter** (recommended - access to many models):
    - endpoint: `https://openrouter.ai/api/v1`
    - model: `google/gemini-flash-1.5-8b` (very cheap)
    - model: `anthropic/claude-3-haiku` (good quality)

    **Ollama** (local, free):
    - endpoint: `http://localhost:11434/v1`
    - model: `qwen2.5:0.5b` or `qwen2.5:1.5b`
    - api_key: (leave empty)

    **OpenAI**:
    - endpoint: `https://api.openai.com/v1`
    - model: `gpt-4o-mini`
    """
    config = AIConfig(
        enabled=config_update.enabled,
        api_endpoint=config_update.api_endpoint,
        api_key=config_update.api_key,
        model=config_update.model,
        max_tokens=config_update.max_tokens,
        temperature=config_update.temperature,
    )

    set_user_ai_config(current_user.id, config)

    return AIConfigResponse(
        enabled=config.enabled,
        api_endpoint=config.api_endpoint,
        has_api_key=bool(config.api_key),
        model=config.model,
        max_tokens=config.max_tokens,
        temperature=config.temperature,
    )


@router.delete("/config")
async def disable_ai(current_user: User = Depends(get_current_user)):
    """Disable AI and clear configuration."""
    if current_user.id in _user_ai_configs:
        del _user_ai_configs[current_user.id]
    return {"message": "AI configuration cleared"}


@router.post("/test")
async def test_ai_connection(current_user: User = Depends(get_current_user)):
    """
    Test the AI configuration with a simple request.

    Returns success if AI is reachable and responding.
    """
    config = get_user_ai_config(current_user.id)
    if not config or not config.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI not configured. Set up AI configuration first.",
        )

    ai = get_ai_service()
    ai.configure(config)

    response = await ai.process(AIRequest(task=AITask.CLEAN_NAME, input_text="Test_Modpack_v1.0"))

    if response.success:
        return {
            "success": True,
            "message": "AI connection successful",
            "test_result": response.result,
            "tokens_used": response.tokens_used,
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI connection failed: {response.error}",
        )


@router.post("/clean-name", response_model=AITaskResult)
async def clean_modpack_name(
    request: CleanNameRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Clean a modpack name using AI.

    Removes version numbers, underscores, and formatting artifacts.

    **Data sent to AI**: Only the raw name (max 500 chars)
    """
    config = get_user_ai_config(current_user.id)
    if not config or not config.enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI not configured")

    ai = get_ai_service()
    ai.configure(config)

    result = await ai.clean_name(request.raw_name)

    return AITaskResult(
        success=result is not None, result=result, error=None if result else "AI processing failed"
    )


@router.post("/enhance-description", response_model=AITaskResult)
async def enhance_description(
    request: EnhanceDescriptionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate or enhance a modpack description using AI.

    **Data sent to AI**:
    - Modpack name
    - Existing description (if any, max 200 chars)
    - Modloader type (if known)
    """
    config = get_user_ai_config(current_user.id)
    if not config or not config.enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI not configured")

    ai = get_ai_service()
    ai.configure(config)

    result = await ai.enhance_description(
        name=request.name,
        existing_desc=request.existing_description,
        modloader=request.modloader,
    )

    return AITaskResult(
        success=result is not None, result=result, error=None if result else "AI processing failed"
    )


@router.post("/detect-modloader", response_model=AITaskResult)
async def detect_modloader(
    request: DetectModloaderRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Detect modloader type from config hints using AI.

    **Data sent to AI**: Only the hint text (file names, config snippets, max 500 chars)
    """
    config = get_user_ai_config(current_user.id)
    if not config or not config.enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI not configured")

    ai = get_ai_service()
    ai.configure(config)

    result = await ai.detect_modloader(request.hints)

    return AITaskResult(
        success=result is not None,
        result=result,
        error=None if result else "AI processing failed or unknown modloader",
    )


@router.post("/suggest-java", response_model=AITaskResult)
async def suggest_java_version(
    request: SuggestJavaRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Suggest Java version for a Minecraft version using AI.

    **Data sent to AI**: Minecraft version and optional additional info
    """
    config = get_user_ai_config(current_user.id)
    if not config or not config.enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI not configured")

    ai = get_ai_service()
    ai.configure(config)

    result = await ai.suggest_java_version(
        minecraft_version=request.minecraft_version,
        additional_info=request.additional_info,
    )

    return AITaskResult(
        success=result is not None, result=result, error=None if result else "AI processing failed"
    )


@router.post("/fix-parse-error", response_model=AITaskResult)
async def fix_parse_error(
    request: FixParseErrorRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Attempt to extract modpack info from a malformed config using AI.

    **Data sent to AI**: Config snippet (max 1000 chars)

    Returns extracted fields: name, minecraft_version, modloader, modloader_version
    """
    config = get_user_ai_config(current_user.id)
    if not config or not config.enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AI not configured")

    ai = get_ai_service()
    ai.configure(config)

    result = await ai.fix_parse_error(request.config_snippet)

    return AITaskResult(
        success=result is not None,
        result=result,
        error=None if result else "AI could not extract valid information",
    )
