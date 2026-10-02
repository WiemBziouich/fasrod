from datetime import date
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.categorie import Categorie
from app.models.collection import Collection
from app.models.produit import Produit
from app.models.promotion import Promotion
from app.models.variante import Variante
from app.schemas.catalog import CollectionRead, PaginatedProduitListRead, ProduitDetailRead, ProduitListItemRead, PromotionRead


class CatalogService:
    def __init__(self, db: Session):
        self.db = db

    def list_collections(self) -> list[CollectionRead]:
        result = self.db.scalars(select(Collection).order_by(Collection.nom.asc()))
        return [CollectionRead.model_validate(collection) for collection in result.all()]

    def list_active_promotions(self) -> list[PromotionRead]:
        today = date.today()
        statement = select(Promotion).where(
            and_(
                func.coalesce(Promotion.date_debut, today) <= today,
                func.coalesce(Promotion.date_fin, today) >= today,
            )
        ).order_by(Promotion.date_fin.asc().nulls_last(), Promotion.code.asc().nulls_last())
        result = self.db.scalars(statement)
        return [PromotionRead.model_validate(promotion) for promotion in result.all()]

    def list_products(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        price_min: int | None = None,
        price_max: int | None = None,
        taille: str | None = None,
        couleur: str | None = None,
        collection_id: UUID | None = None,
        categorie_id: UUID | None = None,
    ) -> PaginatedProduitListRead:
        statement = (
            select(Produit)
            .options(
                selectinload(Produit.categorie),
                selectinload(Produit.collections),
                selectinload(Produit.variantes),
                selectinload(Produit.images),
                selectinload(Produit.promotions),
            )
            .order_by(Produit.nom.asc())
        )

        if collection_id is not None:
            statement = statement.where(Produit.collections.any(Collection.id == collection_id))

        if categorie_id is not None:
            statement = statement.where(Produit.categorie_id == categorie_id)

        if search:
            search_term = f"%{search.strip()}%"
            statement = statement.where(
                or_(
                    Produit.nom.ilike(search_term),
                    Produit.collections.any(
                        or_(
                            Collection.nom.ilike(search_term),
                            Collection.tag_style.ilike(search_term),
                        )
                    ),
                )
            )

        effective_price = func.coalesce(Produit.prix_promo, Produit.prix)

        if price_min is not None:
            statement = statement.where(effective_price >= price_min)

        if price_max is not None:
            statement = statement.where(effective_price <= price_max)

        if taille:
            statement = statement.where(Produit.variantes.any(Variante.taille.ilike(taille.strip())))

        if couleur:
            statement = statement.where(Produit.variantes.any(Variante.couleur.ilike(couleur.strip())))

        total_statement = select(func.count()).select_from(statement.order_by(None).subquery())
        total = self.db.scalar(total_statement) or 0

        items = self.db.scalars(statement.offset(skip).limit(limit)).all()
        return PaginatedProduitListRead(
            items=[ProduitListItemRead.model_validate(item) for item in items],
            total=total,
            skip=skip,
            limit=limit,
        )

    def get_product(self, produit_id: UUID) -> ProduitDetailRead:
        statement = (
            select(Produit)
            .options(
                selectinload(Produit.categorie),
                selectinload(Produit.collections),
                selectinload(Produit.variantes),
                selectinload(Produit.images),
                selectinload(Produit.promotions),
            )
            .where(Produit.id == produit_id)
        )
        produit = self.db.scalar(statement)
        if produit is None:
            raise LookupError("Produit not found")
        return ProduitDetailRead.model_validate(produit)
