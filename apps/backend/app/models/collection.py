import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.associations import produit_collection


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    tag_style: Mapped[str | None] = mapped_column(String(120), nullable=True)

    produits: Mapped[list["Produit"]] = relationship(
        secondary=produit_collection,
        back_populates="collections",
    )
