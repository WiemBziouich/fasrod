from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.client import ClientRead


class AuthRegisterRequest(BaseModel):
    nom: str = Field(min_length=2, max_length=150)
    telephone: str = Field(min_length=8, max_length=32)
    telephone_secondaire: str | None = Field(default=None, max_length=32)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class AuthLoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=12, max_length=128)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    client: ClientRead


class AuthLogoutResponse(BaseModel):
    detail: str
