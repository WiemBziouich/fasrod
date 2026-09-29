from __future__ import annotations

from collections import defaultdict
from functools import lru_cache
from threading import Lock
from time import time

import redis

from app.core.config import settings


class LocalRedis:
    """
    Small in-memory Redis-compatible fallback for local development.

    This avoids requiring Docker/Redis on a low-RAM development machine.
    It is NOT intended for production or multi-process deployments.
    """

    def __init__(self) -> None:
        self._values: dict[str, str] = {}
        self._expires_at: dict[str, float] = {}
        self._counters: defaultdict[str, int] = defaultdict(int)
        self._lock = Lock()

    def _cleanup(self, key: str) -> None:
        expires_at = self._expires_at.get(key)

        if expires_at is not None and expires_at <= time():
            self._values.pop(key, None)
            self._expires_at.pop(key, None)
            self._counters.pop(key, None)

    def get(self, key: str) -> str | None:
        with self._lock:
            self._cleanup(key)
            return self._values.get(key)

    def setex(self, key: str, seconds: int, value: str) -> bool:
        with self._lock:
            self._values[key] = str(value)
            self._expires_at[key] = time() + seconds
            return True

    def delete(self, key: str) -> int:
        with self._lock:
            existed = key in self._values or key in self._counters

            self._values.pop(key, None)
            self._expires_at.pop(key, None)
            self._counters.pop(key, None)

            return 1 if existed else 0

    def incr(self, key: str) -> int:
        with self._lock:
            self._cleanup(key)

            self._counters[key] += 1
            return self._counters[key]

    def expire(self, key: str, seconds: int) -> bool:
        with self._lock:
            if key not in self._values and key not in self._counters:
                return False

            self._expires_at[key] = time() + seconds
            return True


@lru_cache
def get_redis_client():
    """
    Use real Redis when REDIS_URL is configured and reachable.

    Otherwise use an in-memory development fallback.
    """

    if settings.redis_url:
        try:
            client = redis.Redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )

            client.ping()
            return client

        except (redis.RedisError, OSError):
            pass

    if settings.is_production:
        raise RuntimeError(
            "Redis is required in production. "
            "Configure REDIS_URL before starting the backend."
        )

    return LocalRedis()

