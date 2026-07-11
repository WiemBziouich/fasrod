from enum import Enum


class CommandeStatut(str, Enum):
    nouvelle = "nouvelle"
    confirmee = "confirmee"
    preparation = "preparation"
    prete_pour_navex = "prete_pour_navex"
    expediee = "expediee"
    livree = "livree"
    annulee = "annulee"


class FicheNavexStatutLivraison(str, Enum):
    en_attente = "en_attente"
    generee = "generee"
    envoye = "envoye"
    expediee = "expediee"
    livree = "livree"


class MouvementStockType(str, Enum):
    entree = "entree"
    sortie = "sortie"
    ajustement = "ajustement"


class PromotionType(str, Enum):
    pourcentage = "pourcentage"
    montant_fixe = "montant_fixe"
