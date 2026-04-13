import os
import json
import httpx
from abc import ABC, abstractmethod
from typing import Optional, Any
from app.config import settings


class BaseAIProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        pass
    
    @abstractmethod
    async def test_connection(self) -> bool:
        pass


class DeepSeekProvider(BaseAIProvider):
    def __init__(self, api_key: str, api_url: str, model: str):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
    
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        data = {
            "model": model or self.model,
            "messages": messages,
            "temperature": temperature or settings.AI_TEMPERATURE,
            "max_tokens": max_tokens or settings.AI_MAX_TOKENS,
        }
        
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
            response = await client.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
    
    async def test_connection(self) -> bool:
        try:
            result = await self.chat([{"role": "user", "content": "Hi"}], max_tokens=10)
            return "choices" in result
        except Exception:
            return False


class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str, api_url: str, model: str):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
    
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        data = {
            "model": model or self.model,
            "messages": messages,
            "temperature": temperature or settings.AI_TEMPERATURE,
            "max_tokens": max_tokens or settings.AI_MAX_TOKENS,
        }
        
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
            response = await client.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
    
    async def test_connection(self) -> bool:
        try:
            result = await self.chat([{"role": "user", "content": "Hi"}], max_tokens=10)
            return "choices" in result
        except Exception:
            return False


class AnthropicProvider(BaseAIProvider):
    def __init__(self, api_key: str, api_url: str, model: str):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
    
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
        }
        
        anthropic_messages = []
        for msg in messages:
            role = msg["role"]
            if role == "system":
                continue
            anthropic_messages.append({"role": role, "content": msg["content"]})
        
        data = {
            "model": model or self.model,
            "messages": anthropic_messages,
            "max_tokens": max_tokens or settings.AI_MAX_TOKENS,
        }
        if temperature is not None:
            data["temperature"] = temperature
        
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
            response = await client.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
    
    async def test_connection(self) -> bool:
        try:
            result = await self.chat([{"role": "user", "content": "Hi"}], max_tokens=10)
            return "content" in result
        except Exception:
            return False


class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str, api_url: str, model: str):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
    
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        model_name = model or self.model
        url = f"{self.api_url}/{model_name}:generateContent?key={self.api_key}"
        
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
        
        data = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature or settings.AI_TEMPERATURE,
                "maxOutputTokens": max_tokens or settings.AI_MAX_TOKENS,
            }
        }
        
        headers = {"Content-Type": "application/json"}
        
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
    
    async def test_connection(self) -> bool:
        try:
            result = await self.chat([{"role": "user", "content": "Hi"}], max_tokens=10)
            return "candidates" in result
        except Exception:
            return False


class ZhipuProvider(BaseAIProvider):
    def __init__(self, api_key: str, api_url: str, model: str):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
    
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        data = {
            "model": model or self.model,
            "messages": messages,
            "temperature": temperature or settings.AI_TEMPERATURE,
            "max_tokens": max_tokens or settings.AI_MAX_TOKENS,
        }
        
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
            response = await client.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
    
    async def test_connection(self) -> bool:
        try:
            result = await self.chat([{"role": "user", "content": "Hi"}], max_tokens=10)
            return "choices" in result
        except Exception:
            return False


class QwenProvider(BaseAIProvider):
    def __init__(self, api_key: str, api_url: str, model: str):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
    
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        data = {
            "model": model or self.model,
            "input": {
                "messages": messages
            },
            "parameters": {
                "temperature": temperature or settings.AI_TEMPERATURE,
                "max_tokens": max_tokens or settings.AI_MAX_TOKENS,
            }
        }
        
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
            response = await client.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
    
    async def test_connection(self) -> bool:
        try:
            result = await self.chat([{"role": "user", "content": "Hi"}], max_tokens=10)
            return "output" in result or "choices" in result
        except Exception:
            return False


class LocalProvider(BaseAIProvider):
    def __init__(self, api_key: str, api_url: str, model: str):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
    
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        data = {
            "model": model or self.model,
            "messages": messages,
            "stream": False,
        }
        if temperature is not None:
            data["options"] = {"temperature": temperature}
        
        headers = {"Content-Type": "application/json"}
        
        async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT * 2) as client:
            response = await client.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
    
    async def test_connection(self) -> bool:
        try:
            result = await self.chat([{"role": "user", "content": "Hi"}])
            return "message" in result or "response" in result
        except Exception:
            return False


class AIService:
    _instance: Optional["AIService"] = None
    _provider: Optional[BaseAIProvider] = None
    _current_provider_name: str = ""
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._provider is None:
            self._init_provider()
    
    def _init_provider(self):
        config = settings.get_active_provider_config()
        provider = config["provider"]
        self._current_provider_name = provider
        
        providers = {
            "deepseek": DeepSeekProvider,
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
            "gemini": GeminiProvider,
            "zhipu": ZhipuProvider,
            "qwen": QwenProvider,
            "local": LocalProvider,
        }
        
        provider_class = providers.get(provider, DeepSeekProvider)
        self._provider = provider_class(
            api_key=config["api_key"],
            api_url=config["api_url"],
            model=config["model"],
        )
    
    def switch_provider(self, provider: str, api_key: str, api_url: str, model: str):
        providers = {
            "deepseek": DeepSeekProvider,
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
            "gemini": GeminiProvider,
            "zhipu": ZhipuProvider,
            "qwen": QwenProvider,
            "local": LocalProvider,
        }
        
        provider_class = providers.get(provider, DeepSeekProvider)
        self._provider = provider_class(
            api_key=api_key,
            api_url=api_url,
            model=model,
        )
        self._current_provider_name = provider
    
    def get_current_provider(self) -> str:
        return self._current_provider_name
    
    async def chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> dict:
        return await self._provider.chat(messages, model, temperature, max_tokens)
    
    async def test_connection(self) -> bool:
        return await self._provider.test_connection()
    
    async def recognize_intent(self, user_input: str) -> str:
        messages = [
            {
                "role": "system",
                "content": "你是一个意图识别助手，需要分析用户的输入并识别其意图。请从以下意图中选择一个最匹配的：\n"
                           "1. ask_hot_topics - 询问热点资讯\n"
                           "2. ask_opportunities - 询问机会信息\n"
                           "3. ask_learning_resources - 询问学习资源\n"
                           "4. generate_briefing - 生成简报\n"
                           "5. ask_profile - 询问个人画像\n"
                           "6. create_todo - 创建待办事项\n"
                           "7. other - 其他意图\n"
                           "请只返回意图名称，不要返回其他内容。"
            },
            {"role": "user", "content": user_input}
        ]
        
        result = await self.chat(messages, max_tokens=50)
        
        if "choices" in result:
            return result["choices"][0]["message"]["content"].strip()
        elif "content" in result:
            return result["content"][0]["text"].strip()
        elif "candidates" in result:
            return result["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        return "other"
    
    async def generate_briefing_content(self, hot_topics: list, opportunities: list) -> str:
        topics_summary = "\n".join([f"- {topic['title']}: {topic['summary']}" for topic in hot_topics])
        opportunities_summary = "\n".join([f"- {opp['title']}: {opp['summary']} (奖励: {opp['reward']})" for opp in opportunities])
        
        messages = [
            {
                "role": "system",
                "content": "你是一个简报生成助手，需要根据提供的热点资讯和机会信息，生成一份简洁、专业的每日简报。简报应包括：\n"
                           "1. 简短的开场白\n"
                           "2. 热点资讯摘要\n"
                           "3. 机会信息摘要\n"
                           "4. 简短的结语\n"
                           "请保持语言简洁明了，内容准确。"
            },
            {
                "role": "user",
                "content": f"请根据以下信息生成一份简报：\n\n"
                           f"热点资讯：\n{topics_summary}\n\n"
                           f"机会信息：\n{opportunities_summary}"
            }
        ]
        
        result = await self.chat(messages, max_tokens=500)
        
        if "choices" in result:
            return result["choices"][0]["message"]["content"].strip()
        elif "content" in result:
            return result["content"][0]["text"].strip()
        elif "candidates" in result:
            return result["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        return "今日简报已生成，包含最新热点和机会信息。"
    
    async def generate_user_profile(self, user_data: dict) -> str:
        interests = user_data.get('interests', [])
        behaviors = user_data.get('behaviors', {})
        
        interests_str = ", ".join(interests) if interests else "暂无明确兴趣"
        behavior_str = "\n".join([f"- {k}: {v}" for k, v in behaviors.items()]) if behaviors else "暂无行为数据"
        
        messages = [
            {
                "role": "system",
                "content": "你是一个用户画像生成助手，需要根据提供的用户数据，生成一份详细的用户画像描述。画像应包括：\n"
                           "1. 用户的兴趣领域\n"
                           "2. 用户的行为特征\n"
                           "3. 用户的潜在需求\n"
                           "4. 用户的时代关键词\n"
                           "请保持语言生动，描述准确。"
            },
            {
                "role": "user",
                "content": f"请根据以下用户数据生成一份画像：\n\n"
                           f"兴趣领域：{interests_str}\n\n"
                           f"行为特征：\n{behavior_str}"
            }
        ]
        
        result = await self.chat(messages, max_tokens=800)
        
        if "choices" in result:
            return result["choices"][0]["message"]["content"].strip()
        elif "content" in result:
            return result["content"][0]["text"].strip()
        elif "candidates" in result:
            return result["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        return "根据现有数据，无法生成详细的用户画像。"


ai_service = AIService()
