from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_client, get_current_client
from app.core.rate_limit import RateLimitDependency
from app.db.session import get_db
from app.models.client import Client
from app.schemas.commande import CommandeCreate, CommandeDetailRead, CommandeRead, CommandeStatusUpdate
from app.services.commande_service import (
    CommandeService,
    StockInsuffisantError,
    TransitionStatutInvalideError,
    VarianteIntrouvableError,
)

router = APIRouter(prefix="/commandes", tags=["commandes"])

create_commande_rate_limit = RateLimitDependency(scope="create_commande", limit=10, window_seconds=900)


@router.post(
    "",
    response_model=CommandeDetailRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(create_commande_rate_limit)],
)
def create_commande(
    payload: CommandeCreate,
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    service = CommandeService(db)
    try:
        return service.create_commande(current_client.id, payload)
    except VarianteIntrouvableError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except StockInsuffisantError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get("", response_model=list[CommandeRead])
def list_mes_commandes(
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    return CommandeService(db).list_commandes_client(current_client.id)


@router.get("/{commande_id}", response_model=CommandeDetailRead)
def get_commande(
    commande_id: UUID,
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    try:
        return CommandeService(db).get_commande(commande_id, current_client.id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commande not found") from exc


@router.patch("/{commande_id}/statut", response_model=CommandeDetailRead)
def update_statut_commande(
    commande_id: UUID,
    payload: CommandeStatusUpdate,
    _admin: Client = Depends(get_current_admin_client),
    db: Session = Depends(get_db),
):
    service = CommandeService(db)
    try:
        return service.update_statut(commande_id, payload.statut)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commande not found") from exc
    except TransitionStatutInvalideError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc