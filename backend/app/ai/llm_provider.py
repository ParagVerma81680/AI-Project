import json
import asyncio
from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncGenerator, Optional
import httpx

from app.core.config import settings
from app.core.logging import logger

class LLMProvider(ABC):
    """Abstract Interface for Large Language Model Providers."""

    @abstractmethod
    async def generate(self, messages: List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1500) -> str:
        """Synchronous chat completion."""
        pass

    @abstractmethod
    async def generate_stream(self, messages: List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1500) -> AsyncGenerator[str, None]:
        """Streaming chat completion yielding text chunks."""
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """Returns the active model name."""
        pass


class HostedLlamaProvider(LLMProvider):
    """
    Connects to hosted Meta Llama models (via Groq / Together / OpenRouter / vLLM).
    Uses standard OpenAI-compatible chat completions API.
    """
    def __init__(self, api_key: str, base_url: str = "https://api.groq.com/openai/v1", model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    def get_model_name(self) -> str:
        return self.model

    async def generate(self, messages: List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1500) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            for attempt in range(3):
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 429 and attempt < 2:
                    logger.warning(f"Groq 429 Rate limit, retrying in {attempt + 1.5}s...")
                    await asyncio.sleep(attempt + 1.5)
                    continue
                if resp.status_code != 200:
                    logger.error(f"Hosted Llama Error {resp.status_code}: {resp.text}")
                    raise RuntimeError(f"Hosted Llama Error {resp.status_code}: {resp.text}")
                data = resp.json()
                return data["choices"][0]["message"]["content"]

    async def generate_stream(self, messages: List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1500) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    logger.error(f"Hosted Llama Stream Error {response.status_code}: {err_body.decode()}")
                    yield f"Error from LLM service: {response.status_code}"
                    return

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or line.startswith(":"):
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except Exception:
                            continue


class OllamaProvider(LLMProvider):
    """
    Connects to local Ollama instance (e.g. running Llama 3.1 8B or Llama 3.2).
    """
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.1:8b"):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def get_model_name(self) -> str:
        return f"Ollama ({self.model})"

    async def generate(self, messages: List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1500) -> str:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": messages,
            "options": {"temperature": temperature, "num_predict": max_tokens},
            "stream": False
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Ollama Error {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["message"]["content"]

    async def generate_stream(self, messages: List[Dict[str, str]], temperature: float = 0.6, max_tokens: int = 1500) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": messages,
            "options": {"temperature": temperature, "num_predict": max_tokens},
            "stream": True
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    yield f"Error from Ollama: {response.status_code}"
                    return

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                        if chunk.get("done", False):
                            break
                    except Exception:
                        continue


def get_llm_provider() -> LLMProvider:
    """Factory returning configured LLM provider."""
    provider_type = settings.LLM_PROVIDER.lower()
    if provider_type == "ollama":
        return OllamaProvider(base_url=settings.OLLAMA_BASE_URL, model=settings.OLLAMA_MODEL)
    else:
        # Default to hosted Llama (Groq / Together / OpenAI-compatible endpoint)
        key = settings.get_effective_llama_key()
        return HostedLlamaProvider(
            api_key=key,
            base_url=settings.LLAMA_BASE_URL,
            model=settings.LLAMA_MODEL
        )
