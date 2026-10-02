from uuid import UUID

import re

from cloudinary.exceptions import Error as CloudinaryError
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_client
from app.db.session import get_db
from app.models.client import Client
from app.schemas.admin import (
    CategoryWrite,
    CollectionWrite,
    CommandeAdminRead,
    CommandeStatusAdminUpdate,
    ProduitAdminRead,
    ProduitImageUpdate,
    ProduitImageWrite,
    ProduitWrite,
    PromotionWrite,
    StockAdjustWrite,
    VarianteWrite,
)
from app.schemas.catalog import CategoryRead, CollectionRead, ProduitImageRead, PromotionRead, VarianteRead
from app.services.admin_service import AdminService
from app.services.cloudinary_service import (
    CloudinaryConfigurationError,
    InvalidImageUpload,
    delete_product_image,
    upload_product_image,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _not_found(exc: LookupError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


def _bad_request(exc: ValueError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/produits", response_model=list[ProduitAdminRead])
def list_produits(_admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    return AdminService(db).list_produits()


@router.post("/produits", response_model=ProduitAdminRead, status_code=status.HTTP_201_CREATED)
def create_produit(payload: ProduitWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return AdminService(db).create_produit(payload)
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.get("/produits/{produit_id}", response_model=ProduitAdminRead)
def get_produit(produit_id: UUID, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return AdminService(db).get_produit(produit_id)
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.patch("/produits/{produit_id}", response_model=ProduitAdminRead)
def update_produit(produit_id: UUID, payload: ProduitWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return AdminService(db).update_produit(produit_id, payload)
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.delete("/produits/{produit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_produit(produit_id: UUID, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        AdminService(db).delete_produit(produit_id)
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.post("/produits/{produit_id}/variantes", response_model=VarianteRead, status_code=status.HTTP_201_CREATED)
def add_variante(produit_id: UUID, payload: VarianteWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return VarianteRead.model_validate(AdminService(db).add_variante(produit_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.post("/produits/{produit_id}/images", response_model=ProduitImageRead, status_code=status.HTTP_201_CREATED)
def add_image(produit_id: UUID, payload: ProduitImageWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return ProduitImageRead.model_validate(AdminService(db).add_image(produit_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc
    except ValueError as exc:
        raise _bad_request(exc) from exc


@router.post("/produits/{produit_id}/images/upload", response_model=ProduitImageRead, status_code=status.HTTP_201_CREATED)
async def upload_image(
    produit_id: UUID,
    image: UploadFile = File(...),
    couleur: str | None = Form(default=None),
    variante_id: UUID | None = Form(default=None),
    ordre: int = Form(default=0, ge=0),
    est_principale: bool = Form(default=False),
    _admin: Client = Depends(get_current_admin_client),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    try:
        service._validate_image_target(produit_id, variante_id, couleur)
        target = re.sub(r"[^a-zA-Z0-9_-]+", "_", (couleur or "product").lower()).strip("_") or "product"
        uploaded = await upload_product_image(image, f"{produit_id}/{target}")
        try:
            return ProduitImageRead.model_validate(
                service.add_image(
                    produit_id,
                    ProduitImageWrite(
                        variante_id=variante_id,
                        couleur=couleur,
                        url=uploaded.secure_url,
                        ordre=ordre,
                        est_principale=est_principale,
                    ),
                    cloudinary_public_id=uploaded.public_id,
                )
            )
        except Exception:
            delete_product_image(uploaded.public_id)
            raise
    except LookupError as exc:
        raise _not_found(exc) from exc
    except (InvalidImageUpload, ValueError) as exc:
        raise _bad_request(exc) from exc
    except CloudinaryConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except CloudinaryError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Cloudinary upload failed") from exc


@router.patch("/images/{image_id}", response_model=ProduitImageRead)
def update_image(image_id: UUID, payload: ProduitImageUpdate, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return ProduitImageRead.model_validate(AdminService(db).update_image(image_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc
    except ValueError as exc:
        raise _bad_request(exc) from exc


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(image_id: UUID, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        service = AdminService(db)
        image = service.get_image(image_id)
        if image.cloudinary_public_id:
            delete_product_image(image.cloudinary_public_id)
        service.delete_image(image_id)
    except LookupError as exc:
        raise _not_found(exc) from exc
    except CloudinaryConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except CloudinaryError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Cloudinary delete failed") from exc


@router.patch("/variantes/{variante_id}", response_model=VarianteRead)
def update_variante(variante_id: UUID, payload: VarianteWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return VarianteRead.model_validate(AdminService(db).update_variante(variante_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.patch("/variantes/{variante_id}/stock", response_model=VarianteRead)
def adjust_stock(variante_id: UUID, payload: StockAdjustWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return VarianteRead.model_validate(AdminService(db).adjust_stock(variante_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(_admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    return [CategoryRead.model_validate(category) for category in AdminService(db).list_categories()]


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    return CategoryRead.model_validate(AdminService(db).create_category(payload))


@router.patch("/categories/{categorie_id}", response_model=CategoryRead)
def update_category(categorie_id: UUID, payload: CategoryWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return CategoryRead.model_validate(AdminService(db).update_category(categorie_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.delete("/categories/{categorie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(categorie_id: UUID, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        AdminService(db).delete_category(categorie_id)
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.get("/collections", response_model=list[CollectionRead])
def list_collections(_admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    return [CollectionRead.model_validate(collection) for collection in AdminService(db).list_collections()]


@router.post("/collections", response_model=CollectionRead, status_code=status.HTTP_201_CREATED)
def create_collection(payload: CollectionWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    return CollectionRead.model_validate(AdminService(db).create_collection(payload))


@router.patch("/collections/{collection_id}", response_model=CollectionRead)
def update_collection(collection_id: UUID, payload: CollectionWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return CollectionRead.model_validate(AdminService(db).update_collection(collection_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.delete("/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(collection_id: UUID, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        AdminService(db).delete_collection(collection_id)
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.get("/promotions", response_model=list[PromotionRead])
def list_promotions(_admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    return [PromotionRead.model_validate(promotion) for promotion in AdminService(db).list_promotions()]


@router.post("/promotions", response_model=PromotionRead, status_code=status.HTTP_201_CREATED)
def create_promotion(payload: PromotionWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    return PromotionRead.model_validate(AdminService(db).create_promotion(payload))


@router.patch("/promotions/{promotion_id}", response_model=PromotionRead)
def update_promotion(promotion_id: UUID, payload: PromotionWrite, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return PromotionRead.model_validate(AdminService(db).update_promotion(promotion_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.delete("/promotions/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promotion(promotion_id: UUID, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        AdminService(db).delete_promotion(promotion_id)
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.get("/commandes", response_model=list[CommandeAdminRead])
def list_commandes(_admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    return [CommandeAdminRead.model_validate(commande) for commande in AdminService(db).list_commandes()]


@router.get("/commandes/{commande_id}", response_model=CommandeAdminRead)
def get_commande(commande_id: UUID, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return CommandeAdminRead.model_validate(AdminService(db).get_commande(commande_id))
    except LookupError as exc:
        raise _not_found(exc) from exc


@router.patch("/commandes/{commande_id}/statut", response_model=CommandeAdminRead)
def update_commande_statut(commande_id: UUID, payload: CommandeStatusAdminUpdate, _admin: Client = Depends(get_current_admin_client), db: Session = Depends(get_db)):
    try:
        return CommandeAdminRead.model_validate(AdminService(db).update_commande_statut(commande_id, payload))
    except LookupError as exc:
        raise _not_found(exc) from exc
