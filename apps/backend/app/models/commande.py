import uuid

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import CommandeStatut


class Commande(Base):
    __tablename__ = "commandes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    statut: Mapped[CommandeStatut] = mapped_column(
        Enum(CommandeStatut, name="commande_statut"),
        default=CommandeStatut.nouvelle,
        nullable=False,
        index=True,
    )
    gouvernorat: Mapped[str] = mapped_column(String(120), nullable=False)
    ville: Mapped[str] = mapped_column(String(120), nullable=False)
    adresse: Mapped[str] = mapped_column(Text, nullable=False)
    commentaire: Mapped[str | None] = mapped_column(Text, nullable=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    client: Mapped["Client"] = relationship(back_populates="commandes")
    lignes: Mapped[list["LigneCommande"]] = relationship(back_populates="commande", cascade="all, delete-orphan")
    fiche_navex: Mapped["FicheNavex | None"] = relationship(back_populates="commande", uselist=False, cascade="all, delete-orphan")
