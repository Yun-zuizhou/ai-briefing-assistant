from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models.api_config import (
    APIProvider,
    ProviderInfo,
    PROVIDER_INFO,
)
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/api-config", tags=["API Configuration"])


class SwitchProviderRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    api_url: Optional[str] = None
    model: Optional[str] = None


class SwitchProviderResponse(BaseModel):
    success: bool
    message: str
    current_provider: str


class CurrentProviderResponse(BaseModel):
    provider: str
    model: str
    api_url: str
    is_configured: bool


class TestConnectionResponse(BaseModel):
    success: bool
    message: str


@router.get("/providers")
async def list_providers() -> list[ProviderInfo]:
    return list(PROVIDER_INFO.values())


@router.get("/providers/{provider}")
async def get_provider_info(provider: str) -> ProviderInfo:
    try:
        api_provider = APIProvider(provider.lower())
        if api_provider not in PROVIDER_INFO:
            raise HTTPException(status_code=404, detail=f"Provider '{provider}' not found")
        return PROVIDER_INFO[api_provider]
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' not found")


@router.get("/current")
async def get_current_provider() -> CurrentProviderResponse:
    config = settings.get_active_provider_config()
    return CurrentProviderResponse(
        provider=config["provider"],
        model=config["model"],
        api_url=config["api_url"],
        is_configured=bool(config["api_key"]),
    )


@router.post("/switch", response_model=SwitchProviderResponse)
async def switch_provider(request: SwitchProviderRequest) -> SwitchProviderResponse:
    try:
        provider = request.provider.lower()
        api_provider = APIProvider(provider)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid provider: {request.provider}")
    
    if api_provider not in PROVIDER_INFO:
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' not found")
    
    info = PROVIDER_INFO[api_provider]
    
    api_key = request.api_key
    if not api_key:
        env_key_attr = f"{provider.upper()}_API_KEY"
        api_key = getattr(settings, env_key_attr, "")
    
    if not api_key and provider != "local":
        raise HTTPException(status_code=400, detail=f"API key required for provider '{provider}'")
    
    api_url = request.api_url or info.default_url
    model = request.model or info.default_model
    
    try:
        ai_service.switch_provider(
            provider=provider,
            api_key=api_key or "",
            api_url=api_url,
            model=model,
        )
        
        return SwitchProviderResponse(
            success=True,
            message=f"Successfully switched to {info.name}",
            current_provider=provider,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch provider: {str(e)}")


@router.post("/test", response_model=TestConnectionResponse)
async def test_connection() -> TestConnectionResponse:
    try:
        success = await ai_service.test_connection()
        if success:
            return TestConnectionResponse(
                success=True,
                message=f"Connection to {ai_service.get_current_provider()} successful",
            )
        else:
            return TestConnectionResponse(
                success=False,
                message="Connection test failed - please check your API key and configuration",
            )
    except Exception as e:
        return TestConnectionResponse(
            success=False,
            message=f"Connection test failed: {str(e)}",
        )


@router.post("/chat")
async def chat(request: dict) -> dict:
    messages = request.get("messages", [])
    model = request.get("model")
    temperature = request.get("temperature")
    max_tokens = request.get("max_tokens")
    
    if not messages:
        raise HTTPException(status_code=400, detail="Messages are required")
    
    try:
        result = await ai_service.chat(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat request failed: {str(e)}")
