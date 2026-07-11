from dataclasses import dataclass
from functools import lru_cache
import os


def _get_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return value


def _get_int_env(name: str, default: int) -> int:
    value = _get_env(name)
    if value is None:
        return default
    return int(value)


@dataclass(frozen=True)
class Settings:
    app_env: str = "development"
    database_url: str | None = None
    redis_url: str | None = None
    secret_key: str | None = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    backend_cors_origins: str = "http://localhost:3001"

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_env=_get_env("APP_ENV", "development") or "development",
        database_url=_get_env("DATABASE_URL"),
        redis_url=_get_env("REDIS_URL"),
        secret_key=_get_env("SECRET_KEY"),
        jwt_algorithm=_get_env("JWT_ALGORITHM", "HS256") or "HS256",
        access_token_expire_minutes=_get_int_env("ACCESS_TOKEN_EXPIRE_MINUTES", 15),
        refresh_token_expire_days=_get_int_env("REFRESH_TOKEN_EXPIRE_DAYS", 7),
        backend_cors_origins=_get_env("BACKEND_CORS_ORIGINS", "http://localhost:3001") or "http://localhost:3001",
    )


settings = get_settings()
