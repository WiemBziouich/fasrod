from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import get_api_router
from app.core.config import settings
from app.core.security_headers import SecurityHeadersMiddleware


app = FastAPI(title="Fasrord API")

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin"],
)

app.include_router(get_api_router())


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
