from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.commande import Commande
from app.models.enums import CommandeStatut
from app.models.ligne_commande import LigneCommande
from app.models.variante import Variante
from app.schemas.commande import CommandeCreate, CommandeDetailRead, CommandeRead


class VarianteIntrouvableError(Exception):
    def __init__(self, variante_id: UUID):
        self.variante_id = variante_id
        super().__init__(f"Variante {variante_id} introuvable")


class StockInsuffisantError(Exception):
    def __init__(self, variante_id: UUID, demande: int, disponible: int):
        self.variante_id = variante_id
        self.demande = demande
        self.disponible = disponible
        super().__init__(
            f"Stock insuffisant pour la variante {variante_id}: {demande} demandé(s), {disponible} disponible(s)"
        )


class TransitionStatutInvalideError(Exception):
    def __init__(self, statut_actuel: CommandeStatut, statut_demande: CommandeStatut):
        self.statut_actuel = statut_actuel
        self.statut_demande = statut_demande
        super().__init__(f"Transition invalide: {statut_actuel.value} -> {statut_demande.value}")


# Cycle de vie défini dans le cahier des charges (section 4.2 — Gestion des commandes).
ALLOWED_TRANSITIONS: dict[CommandeStatut, set[CommandeStatut]] = {
    CommandeStatut.nouvelle: {CommandeStatut.confirmee, CommandeStatut.annulee},
    CommandeStatut.confirmee: {CommandeStatut.preparation, CommandeStatut.annulee},
    CommandeStatut.preparation: {CommandeStatut.prete_pour_navex, CommandeStatut.annulee},
    CommandeStatut.prete_pour_navex: {CommandeStatut.expediee, CommandeStatut.annulee},
    CommandeStatut.expediee: {CommandeStatut.livree},
    CommandeStatut.livree: set(),
    CommandeStatut.annulee: set(),
}


class CommandeService:
    def __init__(self, db: Session):
        self.db = db

    def create_commande(self, client_id: UUID, payload: CommandeCreate) -> CommandeDetailRead:
        variante_ids = [ligne.variante_id for ligne in payload.lignes]

        # SELECT ... FOR UPDATE : verrouille les lignes de stock concernées pour la durée de la
        # transaction, afin d'éviter que deux commandes simultanées ne survendent la même variante.
        statement = (
            select(Variante)
            .options(selectinload(Variante.produit))
            .where(Variante.id.in_(variante_ids))
            .with_for_update()
        )
        variantes_by_id = {variante.id: variante for variante in self.db.scalars(statement).all()}

        # Validation complète AVANT toute écriture : soit toute la commande passe, soit rien n'est créé.
        for ligne in payload.lignes:
            variante = variantes_by_id.get(ligne.variante_id)
            if variante is None:
                raise VarianteIntrouvableError(ligne.variante_id)
            if variante.quantite_disponible < ligne.quantite:
                raise StockInsuffisantError(ligne.variante_id, ligne.quantite, variante.quantite_disponible)

        commande = Commande(
            client_id=client_id,
            statut=CommandeStatut.nouvelle,
            gouvernorat=payload.gouvernorat,
            ville=payload.ville,
            adresse=payload.adresse,
            commentaire=payload.commentaire,
        )
        self.db.add(commande)

        for ligne in payload.lignes:
            variante = variantes_by_id[ligne.variante_id]
            prix_unitaire = variante.produit.prix_promo or variante.produit.prix

            self.db.add(
                LigneCommande(
                    commande=commande,
                    produit_id=variante.produit_id,
                    variante_id=variante.id,
                    quantite=ligne.quantite,
                    prix_unitaire=prix_unitaire,
                )
            )
            variante.quantite_disponible -= ligne.quantite

        self.db.commit()
        self.db.refresh(commande)
        return self._to_detail(commande)

    def list_commandes_client(self, client_id: UUID) -> list[CommandeRead]:
        statement = (
            select(Commande)
            .where(Commande.client_id == client_id)
            .order_by(Commande.cree_le.desc())
        )
        commandes = self.db.scalars(statement).all()
        return [CommandeRead.model_validate(commande) for commande in commandes]

    def get_commande(self, commande_id: UUID, client_id: UUID) -> CommandeDetailRead:
        statement = (
            select(Commande)
            .where(Commande.id == commande_id, Commande.client_id == client_id)
            .options(selectinload(Commande.lignes))
        )
        commande = self.db.scalar(statement)
        if commande is None:
            # 404 volontairement, pas 403 : on ne révèle pas qu'une commande d'un autre client existe.
            raise LookupError("Commande not found")
        return self._to_detail(commande)

    def update_statut(self, commande_id: UUID, nouveau_statut: CommandeStatut) -> CommandeDetailRead:
        statement = (
            select(Commande).where(Commande.id == commande_id).options(selectinload(Commande.lignes))
        )
        commande = self.db.scalar(statement)
        if commande is None:
            raise LookupError("Commande not found")

        allowed = ALLOWED_TRANSITIONS.get(commande.statut, set())
        if nouveau_statut not in allowed:
            raise TransitionStatutInvalideError(commande.statut, nouveau_statut)

        commande.statut = nouveau_statut
        self.db.commit()
        self.db.refresh(commande)
        return self._to_detail(commande)

    @staticmethod
    def _to_detail(commande: Commande) -> CommandeDetailRead:
        return CommandeDetailRead.model_validate(commande)