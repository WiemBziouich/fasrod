from sqlalchemy import Table, Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


produit_collection = Table(
    "produit_collection",
    Base.metadata,
    Column("produit_id", UUID(as_uuid=True), ForeignKey("produits.id", ondelete="CASCADE"), primary_key=True),
    Column("collection_id", UUID(as_uuid=True), ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
    UniqueConstraint("produit_id", "collection_id", name="uq_produit_collection"),
)


produit_promotion = Table(
    "produit_promotion",
    Base.metadata,
    Column("produit_id", UUID(as_uuid=True), ForeignKey("produits.id", ondelete="CASCADE"), primary_key=True),
    Column("promotion_id", UUID(as_uuid=True), ForeignKey("promotions.id", ondelete="CASCADE"), primary_key=True),
    UniqueConstraint("produit_id", "promotion_id", name="uq_produit_promotion"),
)
