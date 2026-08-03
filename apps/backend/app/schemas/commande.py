from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CommandeStatut


class LigneCommandeCreate(BaseModel):
    variante_id: UUID
    quantite: int = Field(gt=0, le=20)


class CommandeCreate(BaseModel):
    gouvernorat: str = Field(min_length=2, max_length=120)
    ville: str = Field(min_length=2, max_length=120)
    adresse: str = Field(min_length=5, max_length=2000)
    commentaire: str | None = Field(default=None, max_length=2000)
    lignes: list[LigneCommandeCreate] = Field(min_length=1, max_length=50)


class CommandeStatusUpdate(BaseModel):
    statut: CommandeStatut


class LigneCommandeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    produit_id: UUID
    variante_id: UUID
    quantite: int
    prix_unitaire: Decimal


class CommandeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    statut: CommandeStatut
    gouvernorat: str
    ville: str
    adresse: str
    commentaire: str | None = None
    cree_le: datetime


class CommandeDetailRead(CommandeRead):
    lignes: list[LigneCommandeRead] = Field(default_factory=list)