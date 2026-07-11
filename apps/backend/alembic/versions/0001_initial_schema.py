"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-10 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("nom", sa.String(length=120), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nom", name="uq_categories_nom"),
    )

    op.create_table(
        "clients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("nom", sa.String(length=150), nullable=False),
        sa.Column("telephone", sa.String(length=32), nullable=False),
        sa.Column("telephone_secondaire", sa.String(length=32), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("mot_de_passe_hash", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("telephone", name="uq_clients_telephone"),
        sa.UniqueConstraint("email", name="uq_clients_email"),
    )
    op.create_index("ix_clients_telephone", "clients", ["telephone"], unique=False)
    op.create_index("ix_clients_email", "clients", ["email"], unique=False)

    op.create_table(
        "collections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("nom", sa.String(length=120), nullable=False),
        sa.Column("tag_style", sa.String(length=120), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nom", name="uq_collections_nom"),
    )

    op.create_table(
        "promotions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("valeur", sa.Numeric(10, 2), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=True),
        sa.Column("date_debut", sa.Date(), nullable=True),
        sa.Column("date_fin", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_promotions_code"),
        sa.CheckConstraint("type IN ('pourcentage', 'montant_fixe')", name="ck_promotions_type"),
    )
    op.create_index("ix_promotions_code", "promotions", ["code"], unique=False)

    op.create_table(
        "produits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("nom", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("prix", sa.Numeric(10, 2), nullable=False),
        sa.Column("prix_promo", sa.Numeric(10, 2), nullable=True),
        sa.Column("categorie_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["categorie_id"], ["categories.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_produits_nom", "produits", ["nom"], unique=False)
    op.create_index("ix_produits_categorie_id", "produits", ["categorie_id"], unique=False)

    op.create_table(
        "favoris",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["produit_id"], ["produits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("client_id", "produit_id", name="uq_favori_client_produit"),
    )
    op.create_index("ix_favoris_client_id", "favoris", ["client_id"], unique=False)
    op.create_index("ix_favoris_produit_id", "favoris", ["produit_id"], unique=False)

    op.create_table(
        "variantes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("taille", sa.String(length=40), nullable=False),
        sa.Column("couleur", sa.String(length=60), nullable=False),
        sa.Column("quantite_disponible", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["produit_id"], ["produits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("produit_id", "taille", "couleur", name="uq_variante_produit_taille_couleur"),
        sa.CheckConstraint("quantite_disponible >= 0", name="ck_variante_quantite_positive"),
    )
    op.create_index("ix_variantes_produit_id", "variantes", ["produit_id"], unique=False)
    op.create_index("ix_variantes_taille", "variantes", ["taille"], unique=False)
    op.create_index("ix_variantes_couleur", "variantes", ["couleur"], unique=False)

    op.create_table(
        "commandes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("statut", sa.String(length=25), nullable=False),
        sa.Column("gouvernorat", sa.String(length=120), nullable=False),
        sa.Column("ville", sa.String(length=120), nullable=False),
        sa.Column("adresse", sa.Text(), nullable=False),
        sa.Column("commentaire", sa.Text(), nullable=True),
        sa.Column("cree_le", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "statut IN ('nouvelle', 'confirmee', 'preparation', 'prete_pour_navex', 'expediee', 'livree', 'annulee')",
            name="ck_commandes_statut",
        ),
    )
    op.create_index("ix_commandes_client_id", "commandes", ["client_id"], unique=False)
    op.create_index("ix_commandes_statut", "commandes", ["statut"], unique=False)

    op.create_table(
        "fiches_navex",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("commande_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("numero_suivi", sa.String(length=120), nullable=True),
        sa.Column("statut_livraison", sa.String(length=20), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["commande_id"], ["commandes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("commande_id", name="uq_fiches_navex_commande_id"),
        sa.UniqueConstraint("numero_suivi", name="uq_fiches_navex_numero_suivi"),
        sa.CheckConstraint(
            "statut_livraison IN ('en_attente', 'generee', 'envoye', 'expediee', 'livree')",
            name="ck_fiches_navex_statut_livraison",
        ),
    )
    op.create_index("ix_fiches_navex_commande_id", "fiches_navex", ["commande_id"], unique=False)
    op.create_index("ix_fiches_navex_numero_suivi", "fiches_navex", ["numero_suivi"], unique=False)

    op.create_table(
        "lignes_commandes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("commande_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("variante_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantite", sa.Integer(), nullable=False),
        sa.Column("prix_unitaire", sa.Numeric(10, 2), nullable=False),
        sa.ForeignKeyConstraint(["commande_id"], ["commandes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["produit_id"], ["produits.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["variante_id"], ["variantes.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lignes_commandes_commande_id", "lignes_commandes", ["commande_id"], unique=False)
    op.create_index("ix_lignes_commandes_produit_id", "lignes_commandes", ["produit_id"], unique=False)
    op.create_index("ix_lignes_commandes_variante_id", "lignes_commandes", ["variante_id"], unique=False)

    op.create_table(
        "mouvements_stock",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("variante_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("quantite", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("commentaire", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["variante_id"], ["variantes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("type IN ('entree', 'sortie', 'ajustement')", name="ck_mouvements_stock_type"),
    )
    op.create_index("ix_mouvements_stock_variante_id", "mouvements_stock", ["variante_id"], unique=False)
    op.create_index("ix_mouvements_stock_type", "mouvements_stock", ["type"], unique=False)

    op.create_table(
        "produit_collection",
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("collection_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["produit_id"], ["produits.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("produit_id", "collection_id"),
        sa.UniqueConstraint("produit_id", "collection_id", name="uq_produit_collection"),
    )

    op.create_table(
        "produit_promotion",
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("promotion_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["produit_id"], ["produits.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("produit_id", "promotion_id"),
        sa.UniqueConstraint("produit_id", "promotion_id", name="uq_produit_promotion"),
    )


def downgrade() -> None:
    op.drop_table("produit_promotion")
    op.drop_table("produit_collection")
    op.drop_index("ix_mouvements_stock_type", table_name="mouvements_stock")
    op.drop_index("ix_mouvements_stock_variante_id", table_name="mouvements_stock")
    op.drop_table("mouvements_stock")
    op.drop_index("ix_lignes_commandes_variante_id", table_name="lignes_commandes")
    op.drop_index("ix_lignes_commandes_produit_id", table_name="lignes_commandes")
    op.drop_index("ix_lignes_commandes_commande_id", table_name="lignes_commandes")
    op.drop_table("lignes_commandes")
    op.drop_index("ix_fiches_navex_numero_suivi", table_name="fiches_navex")
    op.drop_index("ix_fiches_navex_commande_id", table_name="fiches_navex")
    op.drop_table("fiches_navex")
    op.drop_index("ix_commandes_statut", table_name="commandes")
    op.drop_index("ix_commandes_client_id", table_name="commandes")
    op.drop_table("commandes")
    op.drop_index("ix_variantes_couleur", table_name="variantes")
    op.drop_index("ix_variantes_taille", table_name="variantes")
    op.drop_index("ix_variantes_produit_id", table_name="variantes")
    op.drop_table("variantes")
    op.drop_index("ix_favoris_produit_id", table_name="favoris")
    op.drop_index("ix_favoris_client_id", table_name="favoris")
    op.drop_table("favoris")
    op.drop_index("ix_produits_categorie_id", table_name="produits")
    op.drop_index("ix_produits_nom", table_name="produits")
    op.drop_table("produits")
    op.drop_index("ix_promotions_code", table_name="promotions")
    op.drop_table("promotions")
    op.drop_table("collections")
    op.drop_table("clients")
    op.drop_table("categories")