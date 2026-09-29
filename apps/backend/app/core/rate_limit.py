from dataclasses import dataclass

from fastapi import HTTPException, Request, status

from app.core.redis import get_redis_client


@dataclass(frozen=True)
class RateLimitDependency:
    scope: str
    limit: int
    window_seconds: int

    def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"

        redis_client = get_redis_client()
        key = f"rate_limit:{self.scope}:{client_ip}"

        current = redis_client.incr(key)

        if current == 1:
            redis_client.expire(key, self.window_seconds)

        if current > self.limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests",
            )

