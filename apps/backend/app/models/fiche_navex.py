import uuid

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import FicheNavexStatutLivraison


class FicheNavex(Base):
    __tablename__ = "fiches_navex"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commande_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commandes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    numero_suivi: Mapped[str | None] = mapped_column(String(120), nullable=True, unique=True)
    statut_livraison: Mapped[FicheNavexStatutLivraison] = mapped_column(
        Enum(FicheNavexStatutLivraison, name="fiche_navex_statut_livraison"),
        default=FicheNavexStatutLivraison.en_attente,
        nullable=False,
    )
    cree_le: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    commande: Mapped["Commande"] = relationship(back_populates="fiche_navex")
