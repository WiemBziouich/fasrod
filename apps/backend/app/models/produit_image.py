import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProduitImage(Base):
    __tablename__ = "produit_images"
    __table_args__ = (
        CheckConstraint("ordre >= 0", name="ck_produit_images_ordre_non_negative"),
        CheckConstraint(
            "NOT (variante_id IS NOT NULL AND couleur IS NOT NULL)",
            name="ck_produit_images_single_variant_target",
        ),
        UniqueConstraint("produit_id", "variante_id", "couleur", "url", name="uq_produit_image_target_url"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variante_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("variantes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    couleur: Mapped[str | None] = mapped_column(String(60), nullable=True, index=True)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    cloudinary_public_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    alt_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    est_principale: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")

    produit: Mapped["Produit"] = relationship(back_populates="images")
    variante: Mapped["Variante | None"] = relationship(back_populates="images")