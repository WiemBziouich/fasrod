"""add product images

Revision ID: 0004_product_images
Revises: 0003_email_verification
Create Date: 2026-10-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004_product_images"
down_revision = "0003_email_verification"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "produit_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("variante_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("alt_text", sa.String(length=255), nullable=True),
        sa.Column("ordre", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("est_principale", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["produit_id"], ["produits.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["variante_id"], ["variantes.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("produit_id", "variante_id", "url", name="uq_produit_image_target_url"),
        sa.CheckConstraint("ordre >= 0", name="ck_produit_images_ordre_non_negative"),
    )
    op.create_index("ix_produit_images_produit_id", "produit_images", ["produit_id"], unique=False)
    op.create_index("ix_produit_images_variante_id", "produit_images", ["variante_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_produit_images_variante_id", table_name="produit_images")
    op.drop_index("ix_produit_images_produit_id", table_name="produit_images")
    op.drop_table("produit_images")