from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import RateLimitDependency
from app.db.session import get_db
from app.schemas.auth import AuthLoginRequest, AuthLogoutResponse, AuthRegisterRequest, AuthTokenResponse
from app.schemas.client import ClientRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

register_rate_limit = RateLimitDependency(scope="auth_register", limit=5, window_seconds=900)
login_rate_limit = RateLimitDependency(scope="auth_login", limit=8, window_seconds=900)
refresh_rate_limit = RateLimitDependency(scope="auth_refresh", limit=20, window_seconds=900)


def _set_refresh_cookie(response: Response, refresh_token: str, max_age: int) -> None:
    response.set_cookie(
        key="fasrord_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="strict",
        max_age=max_age,
        path="/api/v1/auth",
    )


@router.post("/register", response_model=AuthTokenResponse, dependencies=[Depends(register_rate_limit)])
def register(payload: AuthRegisterRequest, response: Response, db: Session = Depends(get_db)):
    service = AuthService(db)
    client, token_pair = service.register(payload)
    _set_refresh_cookie(response, token_pair.refresh_token, token_pair.refresh_expires_in)
    return AuthTokenResponse(
        access_token=token_pair.access_token,
        expires_in=token_pair.access_expires_in,
        client=ClientRead.model_validate(client),
    )


@router.post("/login", response_model=AuthTokenResponse, dependencies=[Depends(login_rate_limit)])
def login(payload: AuthLoginRequest, response: Response, db: Session = Depends(get_db)):
    service = AuthService(db)
    client, token_pair = service.login(payload)
    _set_refresh_cookie(response, token_pair.refresh_token, token_pair.refresh_expires_in)
    return AuthTokenResponse(
        access_token=token_pair.access_token,
        expires_in=token_pair.access_expires_in,
        client=ClientRead.model_validate(client),
    )


@router.post("/refresh", response_model=AuthTokenResponse, dependencies=[Depends(refresh_rate_limit)])
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("fasrord_refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")
    service = AuthService(db)
    client, token_pair = service.refresh(refresh_token)
    _set_refresh_cookie(response, token_pair.refresh_token, token_pair.refresh_expires_in)
    return AuthTokenResponse(
        access_token=token_pair.access_token,
        expires_in=token_pair.access_expires_in,
        client=ClientRead.model_validate(client),
    )


@router.post("/logout", response_model=AuthLogoutResponse)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("fasrord_refresh_token")
    if refresh_token:
        from app.security.jwt import decode_token, TokenType

        try:
            payload = decode_token(refresh_token)
            if payload["type"] == TokenType.refresh:
                from uuid import UUID

                AuthService(db).revoke_refresh_token(UUID(payload["sub"]))
        except ValueError:
            pass
    response.delete_cookie(key="fasrord_refresh_token", path="/api/v1/auth")
    return AuthLogoutResponse(detail="Logged out")
