from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class APIProvider(str, Enum):
    DEEPSEEK = "deepseek"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    ZHIPU = "zhipu"
    QWEN = "qwen"
    LOCAL = "local"


class APIConfigBase(BaseModel):
    provider: APIProvider
    api_key: str
    api_url: Optional[str] = None
    model: str
    is_active: bool = False
    max_tokens: int = 1000
    temperature: float = 0.7
    timeout: int = 30


class APIConfig(APIConfigBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class APIConfigCreate(APIConfigBase):
    pass


class APIConfigUpdate(BaseModel):
    api_key: Optional[str] = None
    api_url: Optional[str] = None
    model: Optional[str] = None
    is_active: Optional[bool] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    timeout: Optional[int] = None


class ProviderInfo(BaseModel):
    provider: APIProvider
    name: str
    default_url: str
    default_model: str
    models: list[str]
    description: str


PROVIDER_INFO: dict[APIProvider, ProviderInfo] = {
    APIProvider.DEEPSEEK: ProviderInfo(
        provider=APIProvider.DEEPSEEK,
        name="DeepSeek",
        default_url="https://api.deepseek.com/v1/chat/completions",
        default_model="deepseek-chat",
        models=["deepseek-chat", "deepseek-coder"],
        description="DeepSeek AI - 高性价比中文AI模型"
    ),
    APIProvider.OPENAI: ProviderInfo(
        provider=APIProvider.OPENAI,
        name="OpenAI",
        default_url="https://api.openai.com/v1/chat/completions",
        default_model="gpt-4o-mini",
        models=["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
        description="OpenAI GPT系列模型"
    ),
    APIProvider.ANTHROPIC: ProviderInfo(
        provider=APIProvider.ANTHROPIC,
        name="Anthropic",
        default_url="https://api.anthropic.com/v1/messages",
        default_model="claude-3-5-sonnet-latest",
        models=["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"],
        description="Anthropic Claude系列模型"
    ),
    APIProvider.GEMINI: ProviderInfo(
        provider=APIProvider.GEMINI,
        name="Google Gemini",
        default_url="https://generativelanguage.googleapis.com/v1beta/models",
        default_model="gemini-2.0-flash",
        models=["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
        description="Google Gemini系列模型"
    ),
    APIProvider.ZHIPU: ProviderInfo(
        provider=APIProvider.ZHIPU,
        name="智谱AI",
        default_url="https://open.bigmodel.cn/api/paas/v4/chat/completions",
        default_model="glm-4-flash",
        models=["glm-4", "glm-4-flash", "glm-4-plus", "glm-4-air"],
        description="智谱AI GLM系列模型"
    ),
    APIProvider.QWEN: ProviderInfo(
        provider=APIProvider.QWEN,
        name="通义千问",
        default_url="https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        default_model="qwen-turbo",
        models=["qwen-turbo", "qwen-plus", "qwen-max", "qwen-max-longcontext"],
        description="阿里云通义千问系列模型"
    ),
    APIProvider.LOCAL: ProviderInfo(
        provider=APIProvider.LOCAL,
        name="本地模型",
        default_url="http://localhost:11434/api/chat",
        default_model="llama3",
        models=["llama3", "llama3:70b", "mistral", "codellama", "qwen2"],
        description="本地部署模型 (Ollama等)"
    ),
}
