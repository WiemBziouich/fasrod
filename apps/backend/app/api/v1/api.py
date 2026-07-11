from app.api.v1.auth import router as auth_router
from app.api.v1.catalog import router as catalog_router


def get_api_router():
    from fastapi import APIRouter

    router = APIRouter(prefix="/api/v1")
    router.include_router(auth_router)
    router.include_router(catalog_router)
    return router
