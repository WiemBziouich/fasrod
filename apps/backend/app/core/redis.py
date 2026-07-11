from functools import lru_cache

import redis

from app.core.config import settings


@lru_cache
def get_redis_client() -> redis.Redis:
    if not settings.redis_url:
        raise RuntimeError("REDIS_URL is not configured")
    return redis.Redis.from_url(settings.redis_url, decode_responses=True)
