import os
from functools import lru_cache
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """SmartMart Unified Enterprise Configuration."""
    APP_NAME: str = "SmartMart Autonomous AI Retail Assistant"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database: Supports PostgreSQL with pgvector, falls back seamlessly to SQLite
    DATABASE_URL: str = "sqlite:///./retail_store.db"

    # CORS configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://paragverma81680.github.io",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Security & JWT Authentication
    SECRET_KEY: str = "smartmart_super_secure_enterprise_key_cse276_2026_llama"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # LLM Provider Configuration: "hosted_llama" (Groq / Together / OpenRouter) or "ollama"
    LLM_PROVIDER: str = "hosted_llama"
    LLAMA_MODEL: str = "qwen/qwen3.8-27b"
    LLAMA_API_KEY: str = ""
    LLAMA_BASE_URL: str = "https://api.groq.com/openai/v1"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"

    # Legacy & Groq Fallback compatibility
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    ANTHROPIC_API_KEY: str = ""

    # Embedding and RAG
    EMBEDDING_DIM: int = 384
    RAG_TOP_K: int = 4
    SIMILARITY_THRESHOLD: float = 0.45

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    def get_effective_llama_key(self) -> str:
        """Resolves active Llama key from LLAMA_API_KEY or GROQ_API_KEY."""
        key = self.LLAMA_API_KEY or self.GROQ_API_KEY
        return key.strip() if key else ""

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
