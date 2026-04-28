from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Optional
from enum import Enum
import os
import json


class APIProvider(str, Enum):
    DEEPSEEK = "deepseek"
    OPENAI = "openai"
    NVIDIA = "nvidia"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    ZHIPU = "zhipu"
    QWEN = "qwen"
    LOCAL = "local"


def parse_cors_origins(origins: str | List[str]) -> List[str]:
    if isinstance(origins, list):
        return origins
    try:
        return json.loads(origins)
    except (json.JSONDecodeError, TypeError):
        return [origin.strip() for origin in origins.split(",") if origin.strip()]


class Settings(BaseSettings):
    APP_NAME: str = "AI简报助手"
    DEBUG: bool = True
    ENABLE_BACKGROUND_SCHEDULER: bool = True
    
    DATABASE_URL: str = "sqlite:///./var/local/info_collector.db"
    D1_DATABASE_ID: str = ""
    D1_DATABASE_NAME: str = "ai-briefing-assistant-prod"
    D1_ACCOUNT_ID: str = ""
    D1_API_TOKEN: str = ""
    D1_USE_CLOUD_AS_SOURCE: bool = False
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins_validator(cls, v):
        if isinstance(v, str):
            return parse_cors_origins(v)
        return v
    
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    MOCK_DATA_PATH: str = "apps/web/demo/mock-data"
    
    AI_PROVIDER: str = "deepseek"
    
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_API_URL: str = "https://api.deepseek.com/v1/chat/completions"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    
    OPENAI_API_KEY: str = ""
    OPENAI_API_URL: str = "https://api.openai.com/v1/chat/completions"
    OPENAI_MODEL: str = "gpt-4o-mini"

    NVIDIA_API_KEY: str = ""
    NVIDIA_API_URL: str = "https://integrate.api.nvidia.com/v1/chat/completions"
    NVIDIA_MODEL: str = "meta/llama-3.1-8b-instruct"
    
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_API_URL: str = "https://api.anthropic.com/v1/messages"
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-latest"
    
    GEMINI_API_KEY: str = ""
    GEMINI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta/models"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    ZHIPU_API_KEY: str = ""
    ZHIPU_API_URL: str = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    ZHIPU_MODEL: str = "glm-4-flash"
    
    QWEN_API_KEY: str = ""
    QWEN_API_URL: str = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
    QWEN_MODEL: str = "qwen-turbo"
    
    LOCAL_API_KEY: str = ""
    LOCAL_API_URL: str = "http://localhost:11434/api/chat"
    LOCAL_MODEL: str = "llama3"
    
    AI_MAX_TOKENS: int = 1000
    AI_TEMPERATURE: float = 0.7
    AI_TIMEOUT: int = 30
    AI_DIGEST_DEBUG_FALLBACK: bool = False
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )
    
    def get_provider_config(self, provider_name: str, api_key_override: str | None = None) -> dict:
        provider = str(provider_name or "").lower().strip()
        config_map = {
            "deepseek": {
                "provider": "deepseek",
                "api_key": self.DEEPSEEK_API_KEY,
                "api_url": self.DEEPSEEK_API_URL,
                "model": self.DEEPSEEK_MODEL,
            },
            "openai": {
                "provider": "openai",
                "api_key": self.OPENAI_API_KEY,
                "api_url": self.OPENAI_API_URL,
                "model": self.OPENAI_MODEL,
            },
            "nvidia": {
                "provider": "nvidia",
                "api_key": self.NVIDIA_API_KEY,
                "api_url": self.NVIDIA_API_URL,
                "model": self.NVIDIA_MODEL,
            },
            "anthropic": {
                "provider": "anthropic",
                "api_key": self.ANTHROPIC_API_KEY,
                "api_url": self.ANTHROPIC_API_URL,
                "model": self.ANTHROPIC_MODEL,
            },
            "gemini": {
                "provider": "gemini",
                "api_key": self.GEMINI_API_KEY,
                "api_url": self.GEMINI_API_URL,
                "model": self.GEMINI_MODEL,
            },
            "zhipu": {
                "provider": "zhipu",
                "api_key": self.ZHIPU_API_KEY,
                "api_url": self.ZHIPU_API_URL,
                "model": self.ZHIPU_MODEL,
            },
            "qwen": {
                "provider": "qwen",
                "api_key": self.QWEN_API_KEY,
                "api_url": self.QWEN_API_URL,
                "model": self.QWEN_MODEL,
            },
            "local": {
                "provider": "local",
                "api_key": self.LOCAL_API_KEY,
                "api_url": self.LOCAL_API_URL,
                "model": self.LOCAL_MODEL,
            },
        }
        config = dict(config_map.get(provider, config_map["deepseek"]))
        if api_key_override is not None:
            config["api_key"] = api_key_override
        return config

    def get_active_provider_config(self) -> dict:
        return self.get_provider_config(self.AI_PROVIDER)


settings = Settings()
