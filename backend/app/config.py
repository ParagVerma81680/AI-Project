"""
Centralised configuration using Pydantic BaseSettings.
All sensitive values are read from environment variables (or the .env file).
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide settings."""

    # ------------------------------------------------------------------
    # General
    # ------------------------------------------------------------------
    APP_NAME: str = "AI-Based Smart Retail Store Assistant"
    DEBUG: bool = False

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    DATABASE_URL: str = "sqlite:///./retail_store.db"

    # ------------------------------------------------------------------
    # CORS — comma-separated list stored as a string in .env
    # ------------------------------------------------------------------
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",   # Vite default
        "http://localhost:3000",   # CRA / alternative
        "http://127.0.0.1:5173",
    ]

    # ------------------------------------------------------------------
    # AI (Claude) — never hard-code these; always read from environment
    # ------------------------------------------------------------------
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20241022"

    # ------------------------------------------------------------------
    # Pydantic v2 config
    # ------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance (created once per process)."""
    return Settings()


# Convenience singleton — import this anywhere in the app
settings: Settings = get_settings()
