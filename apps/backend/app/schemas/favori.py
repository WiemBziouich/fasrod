from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.catalog import ProduitListItemRead


class FavoriRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    produit: ProduitListItemRead