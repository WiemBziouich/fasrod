from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.catalog import router as catalog_router
from app.api.v1.favoris import router as favoris_router
from app.api.v1.commandes import router as commandes_router


def get_api_router():
    from fastapi import APIRouter

    router = APIRouter(prefix="/api/v1")
    router.include_router(auth_router)
    router.include_router(admin_router)
    router.include_router(catalog_router)
    router.include_router(favoris_router)
    router.include_router(commandes_router)
    return router