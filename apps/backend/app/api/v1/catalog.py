from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.catalog import CollectionRead, PaginatedProduitListRead, ProduitDetailRead, PromotionRead
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["catalog"])


@router.get("/collections", response_model=list[CollectionRead])
def list_collections(db: Session = Depends(get_db)):
    return CatalogService(db).list_collections()


@router.get("/promotions/active", response_model=list[PromotionRead])
def list_active_promotions(db: Session = Depends(get_db)):
    return CatalogService(db).list_active_promotions()


@router.get("/produits", response_model=PaginatedProduitListRead)
def list_produits(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, min_length=2, max_length=120),
    price_min: int | None = Query(default=None, ge=0),
    price_max: int | None = Query(default=None, ge=0),
    taille: str | None = Query(default=None, min_length=1, max_length=40),
    couleur: str | None = Query(default=None, min_length=1, max_length=60),
    collection_id: UUID | None = None,
    categorie_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    return CatalogService(db).list_products(
        skip=skip,
        limit=limit,
        search=search,
        price_min=price_min,
        price_max=price_max,
        taille=taille,
        couleur=couleur,
        collection_id=collection_id,
        categorie_id=categorie_id,
    )


@router.get("/produits/{produit_id}", response_model=ProduitDetailRead)
def get_produit(produit_id: UUID, db: Session = Depends(get_db)):
    try:
        return CatalogService(db).get_product(produit_id)
    except LookupError as exc:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produit not found") from exc
