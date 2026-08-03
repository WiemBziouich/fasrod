from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.categorie import Categorie
from app.models.collection import Collection
from app.models.commande import Commande
from app.models.enums import CommandeStatut
from app.models.produit import Produit
from app.models.promotion import Promotion
from app.models.variante import Variante
from app.schemas.admin import (
    CategoryWrite,
    CollectionWrite,
    CommandeStatusAdminUpdate,
    ProduitAdminRead,
    ProduitWrite,
    PromotionWrite,
    StockAdjustWrite,
    VarianteWrite,
)


class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def list_produits(self) -> list[ProduitAdminRead]:
        statement = (
            select(Produit)
            .options(
                selectinload(Produit.categorie),
                selectinload(Produit.collections),
                selectinload(Produit.variantes),
                selectinload(Produit.promotions),
            )
            .order_by(Produit.nom.asc())
        )
        return [ProduitAdminRead.model_validate(produit) for produit in self.db.scalars(statement).all()]

    def create_produit(self, payload: ProduitWrite) -> ProduitAdminRead:
        categorie = self.db.get(Categorie, payload.categorie_id)
        if categorie is None:
            raise LookupError("Categorie not found")

        produit = Produit(
            nom=payload.nom,
            description=payload.description,
            prix=payload.prix,
            prix_promo=payload.prix_promo,
            categorie_id=payload.categorie_id,
        )
        produit.collections = self._load_collections(payload.collection_ids)
        produit.promotions = self._load_promotions(payload.promotion_ids)

        self.db.add(produit)
        self.db.commit()
        self.db.refresh(produit)
        return self.get_produit(produit.id)

    def get_produit(self, produit_id: UUID) -> ProduitAdminRead:
        statement = self._product_statement().where(Produit.id == produit_id)
        produit = self.db.scalar(statement)
        if produit is None:
            raise LookupError("Produit not found")
        return ProduitAdminRead.model_validate(produit)

    def update_produit(self, produit_id: UUID, payload: ProduitWrite) -> ProduitAdminRead:
        produit = self.db.get(Produit, produit_id)
        if produit is None:
            raise LookupError("Produit not found")

        categorie = self.db.get(Categorie, payload.categorie_id)
        if categorie is None:
            raise LookupError("Categorie not found")

        produit.nom = payload.nom
        produit.description = payload.description
        produit.prix = payload.prix
        produit.prix_promo = payload.prix_promo
        produit.categorie_id = payload.categorie_id
        produit.collections = self._load_collections(payload.collection_ids)
        produit.promotions = self._load_promotions(payload.promotion_ids)

        self.db.commit()
        self.db.refresh(produit)
        return self.get_produit(produit_id)

    def delete_produit(self, produit_id: UUID) -> None:
        produit = self.db.get(Produit, produit_id)
        if produit is None:
            raise LookupError("Produit not found")
        self.db.delete(produit)
        self.db.commit()

    def add_variante(self, produit_id: UUID, payload: VarianteWrite) -> Variante:
        produit = self.db.get(Produit, produit_id)
        if produit is None:
            raise LookupError("Produit not found")

        variante = Variante(
            produit_id=produit_id,
            taille=payload.taille,
            couleur=payload.couleur,
            quantite_disponible=payload.quantite_disponible,
        )
        self.db.add(variante)
        self.db.commit()
        self.db.refresh(variante)
        return variante

    def update_variante(self, variante_id: UUID, payload: VarianteWrite) -> Variante:
        variante = self.db.get(Variante, variante_id)
        if variante is None:
            raise LookupError("Variante not found")

        variante.taille = payload.taille
        variante.couleur = payload.couleur
        variante.quantite_disponible = payload.quantite_disponible
        self.db.commit()
        self.db.refresh(variante)
        return variante

    def adjust_stock(self, variante_id: UUID, payload: StockAdjustWrite) -> Variante:
        variante = self.db.get(Variante, variante_id)
        if variante is None:
            raise LookupError("Variante not found")

        variante.quantite_disponible = payload.quantite_disponible
        self.db.commit()
        self.db.refresh(variante)
        return variante

    def list_categories(self) -> list[Categorie]:
        return list(self.db.scalars(select(Categorie).order_by(Categorie.nom.asc())).all())

    def create_category(self, payload: CategoryWrite) -> Categorie:
        category = Categorie(nom=payload.nom)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update_category(self, categorie_id: UUID, payload: CategoryWrite) -> Categorie:
        category = self.db.get(Categorie, categorie_id)
        if category is None:
            raise LookupError("Categorie not found")
        category.nom = payload.nom
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete_category(self, categorie_id: UUID) -> None:
        category = self.db.get(Categorie, categorie_id)
        if category is None:
            raise LookupError("Categorie not found")
        self.db.delete(category)
        self.db.commit()

    def list_collections(self) -> list[Collection]:
        return list(self.db.scalars(select(Collection).order_by(Collection.nom.asc())).all())

    def create_collection(self, payload: CollectionWrite) -> Collection:
        collection = Collection(nom=payload.nom, tag_style=payload.tag_style)
        self.db.add(collection)
        self.db.commit()
        self.db.refresh(collection)
        return collection

    def update_collection(self, collection_id: UUID, payload: CollectionWrite) -> Collection:
        collection = self.db.get(Collection, collection_id)
        if collection is None:
            raise LookupError("Collection not found")
        collection.nom = payload.nom
        collection.tag_style = payload.tag_style
        self.db.commit()
        self.db.refresh(collection)
        return collection

    def delete_collection(self, collection_id: UUID) -> None:
        collection = self.db.get(Collection, collection_id)
        if collection is None:
            raise LookupError("Collection not found")
        self.db.delete(collection)
        self.db.commit()

    def list_promotions(self) -> list[Promotion]:
        return list(self.db.scalars(select(Promotion).order_by(Promotion.date_fin.asc().nulls_last())).all())

    def create_promotion(self, payload: PromotionWrite) -> Promotion:
        promotion = Promotion(**payload.model_dump())
        self.db.add(promotion)
        self.db.commit()
        self.db.refresh(promotion)
        return promotion

    def update_promotion(self, promotion_id: UUID, payload: PromotionWrite) -> Promotion:
        promotion = self.db.get(Promotion, promotion_id)
        if promotion is None:
            raise LookupError("Promotion not found")
        for key, value in payload.model_dump().items():
            setattr(promotion, key, value)
        self.db.commit()
        self.db.refresh(promotion)
        return promotion

    def delete_promotion(self, promotion_id: UUID) -> None:
        promotion = self.db.get(Promotion, promotion_id)
        if promotion is None:
            raise LookupError("Promotion not found")
        self.db.delete(promotion)
        self.db.commit()

    def list_commandes(self) -> list[Commande]:
        statement = select(Commande).order_by(Commande.cree_le.desc())
        return list(self.db.scalars(statement).all())

    def get_commande(self, commande_id: UUID) -> Commande:
        commande = self.db.get(Commande, commande_id)
        if commande is None:
            raise LookupError("Commande not found")
        return commande

    def update_commande_statut(self, commande_id: UUID, payload: CommandeStatusAdminUpdate) -> Commande:
        commande = self.get_commande(commande_id)
        if commande.statut == CommandeStatut.expediee and payload.statut == CommandeStatut.annulee:
            raise ValueError("Impossible d'annuler une commande expédiée")
        commande.statut = payload.statut
        self.db.commit()
        self.db.refresh(commande)
        return commande

    def _product_statement(self):
        return (
            select(Produit)
            .options(
                selectinload(Produit.categorie),
                selectinload(Produit.collections),
                selectinload(Produit.variantes),
                selectinload(Produit.promotions),
            )
        )

    def _load_collections(self, collection_ids: list[UUID]) -> list[Collection]:
        if not collection_ids:
            return []
        statement = select(Collection).where(Collection.id.in_(collection_ids))
        collections = list(self.db.scalars(statement).all())
        if len(collections) != len(set(collection_ids)):
            raise LookupError("Collection not found")
        return collections

    def _load_promotions(self, promotion_ids: list[UUID]) -> list[Promotion]:
        if not promotion_ids:
            return []
        statement = select(Promotion).where(Promotion.id.in_(promotion_ids))
        promotions = list(self.db.scalars(statement).all())
        if len(promotions) != len(set(promotion_ids)):
            raise LookupError("Promotion not found")
        return promotions