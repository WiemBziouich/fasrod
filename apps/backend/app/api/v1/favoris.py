from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_client
from app.core.rate_limit import RateLimitDependency
from app.db.session import get_db
from app.models.client import Client
from app.schemas.favori import FavoriRead
from app.services.favori_service import FavoriService

router = APIRouter(prefix="/favoris", tags=["favoris"])

toggle_rate_limit = RateLimitDependency(scope="favori_toggle", limit=20, window_seconds=900)


@router.post("/{produit_id}", response_model=FavoriRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(toggle_rate_limit)])
def add_favori(produit_id: UUID, current_client: Client = Depends(get_current_client), db: Session = Depends(get_db)):
    try:
        return FavoriService(db).add_favori(current_client.id, produit_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{produit_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favori(produit_id: UUID, current_client: Client = Depends(get_current_client), db: Session = Depends(get_db)):
    FavoriService(db).remove_favori(current_client.id, produit_id)
    return None


@router.get("", response_model=list[FavoriRead])
def list_favoris(current_client: Client = Depends(get_current_client), db: Session = Depends(get_db)):
    return FavoriService(db).list_favoris(current_client.id)