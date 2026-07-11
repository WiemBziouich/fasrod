import uuid

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Favori(Base):
    __tablename__ = "favoris"
    __table_args__ = (UniqueConstraint("client_id", "produit_id", name="uq_favori_client_produit"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    cree_le: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    client: Mapped["Client"] = relationship(back_populates="favoris")
    produit: Mapped["Produit"] = relationship(back_populates="favoris")
