"""store Cloudinary asset identifiers for product images

Revision ID: 0006_cloudinary_public_id
Revises: 0005_product_image_colors
Create Date: 2026-10-02 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "0006_cloudinary_public_id"
down_revision = "0005_product_image_colors"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("produit_images", sa.Column("cloudinary_public_id", sa.String(length=255), nullable=True))
    op.create_index("ix_produit_images_cloudinary_public_id", "produit_images", ["cloudinary_public_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_produit_images_cloudinary_public_id", table_name="produit_images")
    op.drop_column("produit_images", "cloudinary_public_id")