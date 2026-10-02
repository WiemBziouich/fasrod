"""support color-level product images

Revision ID: 0005_product_image_colors
Revises: 0004_product_images
Create Date: 2026-10-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "0005_product_image_colors"
down_revision = "0004_product_images"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("produit_images", sa.Column("couleur", sa.String(length=60), nullable=True))
    op.drop_constraint("uq_produit_image_target_url", "produit_images", type_="unique")
    op.create_unique_constraint(
        "uq_produit_image_target_url",
        "produit_images",
        ["produit_id", "variante_id", "couleur", "url"],
    )
    op.create_check_constraint(
        "ck_produit_images_single_variant_target",
        "produit_images",
        "NOT (variante_id IS NOT NULL AND couleur IS NOT NULL)",
    )
    op.create_index("ix_produit_images_couleur", "produit_images", ["couleur"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_produit_images_couleur", table_name="produit_images")
    op.drop_constraint("ck_produit_images_single_variant_target", "produit_images", type_="check")
    op.drop_constraint("uq_produit_image_target_url", "produit_images", type_="unique")
    op.create_unique_constraint(
        "uq_produit_image_target_url",
        "produit_images",
        ["produit_id", "variante_id", "url"],
    )
    op.drop_column("produit_images", "couleur")