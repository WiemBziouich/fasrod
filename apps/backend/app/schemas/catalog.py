from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom: str


class CollectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom: str
    tag_style: str | None = None


class PromotionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    valeur: Decimal
    code: str | None = None
    date_debut: date | None = None
    date_fin: date | None = None
    description: str | None = None


class VarianteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    taille: str
    couleur: str
    quantite_disponible: int


class ProduitListItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom: str
    description: str
    prix: Decimal
    prix_promo: Decimal | None = None
    categorie: CategoryRead
    collections: list[CollectionRead] = Field(default_factory=list)
    variantes: list[VarianteRead] = Field(default_factory=list)
    promotions: list[PromotionRead] = Field(default_factory=list)


class ProduitDetailRead(ProduitListItemRead):
    variantes: list[VarianteRead] = Field(default_factory=list)


class PaginatedProduitListRead(BaseModel):
    items: list[ProduitListItemRead]
    total: int
    skip: int
    limit: int
