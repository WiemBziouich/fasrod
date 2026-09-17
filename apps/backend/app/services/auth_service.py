from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.core.redis import get_redis_client
from app.models.client import Client
from app.schemas.auth import AuthLoginRequest, AuthRegisterRequest
from app.security.jwt import create_access_token, create_refresh_token, decode_token, TokenType
from app.security.password import hash_password, verify_password


from functools import lru_cache


@lru_cache
def _dummy_password_hash() -> str:
    return hash_password("this-is-not-a-real-password-used-only-for-timing")

@dataclass(frozen=True)
class TokenPair:
    access_token: str
    access_expires_in: int
    refresh_token: str
    refresh_jti: str
    refresh_expires_in: int


class AuthService:
    refresh_session_prefix = "refresh_session"

    def __init__(self, db: Session):
        self.db = db
        self.redis_client = get_redis_client()

    def register(self, payload: AuthRegisterRequest) -> tuple[Client, TokenPair]:
        existing = self.db.scalar(
            select(Client).where(or_(Client.email == payload.email, Client.telephone == payload.telephone))
        )
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Client already exists")

        client = Client(
            nom=payload.nom,
            telephone=payload.telephone,
            telephone_secondaire=payload.telephone_secondaire,
            email=payload.email,
            mot_de_passe_hash=hash_password(payload.password),
        )
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)
        token_pair = self._issue_tokens(str(client.id))
        return client, token_pair

    def login(self, payload: AuthLoginRequest) -> tuple[Client, TokenPair]:
        client = self.db.scalar(
            select(Client).where(or_(Client.email == payload.identifier, Client.telephone == payload.identifier))
        )
        hash_to_check = client.mot_de_passe_hash if client is not None else _dummy_password_hash()
        password_ok = verify_password(payload.password, hash_to_check)
        if client is None or not password_ok:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token_pair = self._issue_tokens(str(client.id))
        return client, token_pair

    def refresh(self, refresh_token: str) -> tuple[Client, TokenPair]:
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token") from exc

        if payload["type"] != TokenType.refresh:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        client = self.db.get(Client, UUID(payload["sub"]))
        if client is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client not found")

        session_key = self._session_key(client.id)
        current_jti = self.redis_client.get(session_key)
        if current_jti is None or current_jti != payload["jti"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")

        token_pair = self._issue_tokens(str(client.id))
        return client, token_pair

    def revoke_refresh_token(self, client_id: UUID) -> None:
        self.redis_client.delete(self._session_key(client_id))

    def _issue_tokens(self, subject: str) -> TokenPair:
        access_token, access_expires_in = create_access_token(subject)
        refresh_token, refresh_jti, refresh_expires_in = create_refresh_token(subject)
        client_id = UUID(subject)
        self.redis_client.setex(self._session_key(client_id), refresh_expires_in, refresh_jti)
        return TokenPair(
            access_token=access_token,
            access_expires_in=access_expires_in,
            refresh_token=refresh_token,
            refresh_jti=refresh_jti,
            refresh_expires_in=refresh_expires_in,
        )

    def _session_key(self, client_id: UUID) -> str:
        return f"{self.refresh_session_prefix}:{client_id}"
