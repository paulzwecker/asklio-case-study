from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables / .env."""

    app_name: str = "askLio Procurement API"
    debug: bool = True
    cors_allow_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    openai_api_key: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance to avoid re-parsing env."""
    return Settings()


settings = get_settings()
