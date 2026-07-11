import uuid

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LigneCommande(Base):
    __tablename__ = "lignes_commandes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commande_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commandes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    variante_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variantes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantite: Mapped[int] = mapped_column(nullable=False)
    prix_unitaire: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    commande: Mapped["Commande"] = relationship(back_populates="lignes")
    produit: Mapped["Produit"] = relationship(back_populates="lignes_commandes")
    variante: Mapped["Variante"] = relationship(back_populates="lignes_commandes")
