from datetime import UTC, datetime, timedelta
from uuid import uuid4

from jose import JWTError, jwt

from app.core.config import settings


class TokenType:
    access = "access"
    refresh = "refresh"


def _secret_key() -> str:
    if not settings.secret_key:
        raise RuntimeError("SECRET_KEY is not configured")
    return settings.secret_key


def create_access_token(subject: str) -> tuple[str, int]:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expires_at = datetime.now(UTC) + expires_delta
    payload = {
        "sub": subject,
        "type": TokenType.access,
        "jti": str(uuid4()),
        "iat": int(datetime.now(UTC).timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, _secret_key(), algorithm=settings.jwt_algorithm)
    return token, settings.access_token_expire_minutes * 60


def create_refresh_token(subject: str) -> tuple[str, str, int]:
    expires_delta = timedelta(days=settings.refresh_token_expire_days)
    expires_at = datetime.now(UTC) + expires_delta
    jti = str(uuid4())
    payload = {
        "sub": subject,
        "type": TokenType.refresh,
        "jti": jti,
        "iat": int(datetime.now(UTC).timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, _secret_key(), algorithm=settings.jwt_algorithm)
    return token, jti, settings.refresh_token_expire_days * 24 * 60 * 60


def decode_token(token: str) -> dict[str, str]:
    try:
        payload = jwt.decode(token, _secret_key(), algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc

    subject = payload.get("sub")
    token_type = payload.get("type")
    jti = payload.get("jti")
    if not subject or not token_type or not jti:
        raise ValueError("Invalid token payload")
    return {"sub": str(subject), "type": str(token_type), "jti": str(jti)}
