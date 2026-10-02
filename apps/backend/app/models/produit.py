import uuid

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.associations import produit_collection, produit_promotion


class Produit(Base):
    __tablename__ = "produits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    prix: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    prix_promo: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    categorie_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    categorie: Mapped["Categorie"] = relationship(back_populates="produits")
    variantes: Mapped[list["Variante"]] = relationship(back_populates="produit", cascade="all, delete-orphan")
    images: Mapped[list["ProduitImage"]] = relationship(back_populates="produit", cascade="all, delete-orphan")
    lignes_commandes: Mapped[list["LigneCommande"]] = relationship(back_populates="produit")
    favoris: Mapped[list["Favori"]] = relationship(back_populates="produit", cascade="all, delete-orphan")
    collections: Mapped[list["Collection"]] = relationship(
        secondary=produit_collection,
        back_populates="produits",
    )
    promotions: Mapped[list["Promotion"]] = relationship(
        secondary=produit_promotion,
        back_populates="produits",
    )
