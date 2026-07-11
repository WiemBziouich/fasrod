import uuid

from sqlalchemy import CheckConstraint, ForeignKey, String, UniqueConstraint
from sqlalchemy import Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Variante(Base):
    __tablename__ = "variantes"
    __table_args__ = (
        UniqueConstraint("produit_id", "taille", "couleur", name="uq_variante_produit_taille_couleur"),
        CheckConstraint("quantite_disponible >= 0", name="ck_variante_quantite_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    taille: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    couleur: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    quantite_disponible: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    produit: Mapped["Produit"] = relationship(back_populates="variantes")
    mouvements_stock: Mapped[list["MouvementStock"]] = relationship(back_populates="variante", cascade="all, delete-orphan")
    lignes_commandes: Mapped[list["LigneCommande"]] = relationship(back_populates="variante")
