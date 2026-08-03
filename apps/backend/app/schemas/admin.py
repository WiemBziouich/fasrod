from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CommandeStatut, PromotionType
from app.schemas.catalog import CategoryRead, CollectionRead, ProduitDetailRead, ProduitListItemRead, PromotionRead, VarianteRead


class CategoryWrite(BaseModel):
    nom: str = Field(min_length=2, max_length=120)


class CollectionWrite(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    tag_style: str | None = Field(default=None, max_length=120)


class PromotionWrite(BaseModel):
    type: PromotionType
    valeur: Decimal = Field(gt=0)
    code: str | None = Field(default=None, max_length=80)
    date_debut: date | None = None
    date_fin: date | None = None
    description: str | None = Field(default=None, max_length=2000)


class VarianteWrite(BaseModel):
    taille: str = Field(min_length=1, max_length=40)
    couleur: str = Field(min_length=1, max_length=60)
    quantite_disponible: int = Field(ge=0)


class ProduitWrite(BaseModel):
    nom: str = Field(min_length=2, max_length=180)
    description: str = Field(min_length=10, max_length=5000)
    prix: Decimal = Field(gt=0)
    prix_promo: Decimal | None = Field(default=None, gt=0)
    categorie_id: UUID
    collection_ids: list[UUID] = Field(default_factory=list)
    promotion_ids: list[UUID] = Field(default_factory=list)


class ProduitAdminRead(ProduitDetailRead):
    pass


class CommandeAdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    statut: CommandeStatut
    client_id: UUID
    gouvernorat: str
    ville: str
    adresse: str
    commentaire: str | None = None
    cree_le: date | None = None


class CommandeAdminDetailRead(ProduitListItemRead):
    pass


class CommandeStatusAdminUpdate(BaseModel):
    statut: CommandeStatut


class StockAdjustWrite(BaseModel):
    quantite_disponible: int = Field(ge=0)
