import uuid

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.associations import produit_promotion
from app.models.enums import PromotionType


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[PromotionType] = mapped_column(
        Enum(PromotionType, name="promotion_type"),
        nullable=False,
        index=True,
    )
    valeur: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    code: Mapped[str | None] = mapped_column(String(80), nullable=True, unique=True, index=True)
    date_debut: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    produits: Mapped[list["Produit"]] = relationship(
        secondary=produit_promotion,
        back_populates="promotions",
    )
