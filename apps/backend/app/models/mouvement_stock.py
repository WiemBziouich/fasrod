import uuid

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MouvementStockType


class MouvementStock(Base):
    __tablename__ = "mouvements_stock"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    variante_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variantes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[MouvementStockType] = mapped_column(
        Enum(MouvementStockType, name="mouvement_stock_type"),
        nullable=False,
        index=True,
    )
    quantite: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    commentaire: Mapped[str | None] = mapped_column(Text, nullable=True)

    variante: Mapped["Variante"] = relationship(back_populates="mouvements_stock")
