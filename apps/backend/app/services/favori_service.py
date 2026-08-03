from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.favori import Favori
from app.models.produit import Produit


class FavoriService:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return select(Favori).options(
            selectinload(Favori.produit).selectinload(Produit.categorie),
            selectinload(Favori.produit).selectinload(Produit.collections),
            selectinload(Favori.produit).selectinload(Produit.variantes),
            selectinload(Favori.produit).selectinload(Produit.promotions),
        )

    def add_favori(self, client_id: UUID, produit_id: UUID) -> Favori:
        existing = self.db.scalar(
            self._base_query().where(Favori.client_id == client_id, Favori.produit_id == produit_id)
        )
        if existing is not None:
            return existing

        produit = self.db.get(Produit, produit_id)
        if produit is None:
            raise LookupError("Produit not found")

        favori = Favori(client_id=client_id, produit_id=produit_id)
        self.db.add(favori)
        self.db.commit()

        refreshed = self.db.scalar(
            self._base_query().where(Favori.client_id == client_id, Favori.produit_id == produit_id)
        )
        if refreshed is None:
            raise LookupError("Favori not found")
        return refreshed

    def remove_favori(self, client_id: UUID, produit_id: UUID) -> None:
        favori = self.db.scalar(
            select(Favori).where(Favori.client_id == client_id, Favori.produit_id == produit_id)
        )
        if favori is None:
            return

        self.db.delete(favori)
        self.db.commit()

    def list_favoris(self, client_id: UUID) -> list[Favori]:
        statement = self._base_query().where(Favori.client_id == client_id).order_by(Favori.cree_le.desc())
        return list(self.db.scalars(statement).all())