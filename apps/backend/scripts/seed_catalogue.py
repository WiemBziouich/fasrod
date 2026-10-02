from decimal import Decimal

from sqlalchemy import select

from app.db.session import get_session_maker
from app.models import Categorie, Produit, Variante

SIZES = ("XS", "S", "M", "L", "XL", "XXL")
TEMPORARY_STOCK = 10

PRODUCTS = (
    {
        "name": "EXTRA Baggy Jogger",
        "price": Decimal("35"),
        "colors": ("Noir", "Gris", "Rose"),
        "category": "Shorts",
        "description": "Comfortable baggy jogger for everyday wear.",
    },
    {
        "name": "Camo Baggy",
        "price": Decimal("57"),
        "colors": ("Beige", "Vert", "Marron"),
        "category": "Shorts",
        "description": "Comfortable camo baggy for everyday wear.",
    },
    {
        "name": "FAMILY Baggy Jogger",
        "price": Decimal("42"),
        "colors": ("Noir", "Gris", "Gris charbon"),
        "category": "Shorts",
        "description": "Comfortable baggy jogger for everyday wear.",
    },
    {
        "name": "Baggy Jogger",
        "price": Decimal("35"),
        "colors": ("Gris", "Noir", "Gris charbon", "Rose", "Beige", "Blanc"),
        "category": "Shorts",
        "description": "Comfortable baggy jogger for everyday wear.",
    },
    {
        "name": "Fasrod Baggy Jogger",
        "price": Decimal("35"),
        "colors": ("Noir", "Gris", "Gris charbon"),
        "category": "Shorts",
        "description": "Comfortable baggy jogger for everyday wear.",
    },
    {
        "name": "California Set",
        "price": Decimal("58"),
        "colors": ("Rose", "Bleu ciel", "Bleu marine", "Noir"),
        "category": "Ensembles",
        "description": "Comfortable matching set for everyday wear.",
    },
    {
        "name": "Fasrod Set",
        "price": Decimal("58"),
        "colors": ("Noir", "Gris"),
        "category": "Ensembles",
        "description": "Comfortable matching set for everyday wear.",
    },
    {
        "name": "Bape T-shirt",
        "price": Decimal("29"),
        "colors": ("Noir", "Rose", "Bleu"),
        "category": "T-shirts",
        "description": "Comfortable casual t-shirt for everyday wear.",
    },
    {
        "name": "Aura T-shirt",
        "price": Decimal("29"),
        "colors": ("Noir", "Blanc"),
        "category": "T-shirts",
        "description": "Comfortable casual t-shirt for everyday wear.",
    },
    {
        "name": "STWD T-shirt",
        "price": Decimal("29"),
        "colors": ("Gris", "Bleu", "Rose"),
        "category": "T-shirts",
        "description": "Comfortable casual t-shirt for everyday wear.",
    },
)


def seed_catalogue() -> tuple[int, int]:
    session = get_session_maker()()
    products_created = 0
    variants_created = 0

    try:
        with session.begin():
            categories = {
                category.nom: category
                for category in session.scalars(
                    select(Categorie).where(
                        Categorie.nom.in_({product["category"] for product in PRODUCTS})
                    )
                ).all()
            }
            missing_categories = {
                product["category"] for product in PRODUCTS
            } - categories.keys()
            if missing_categories:
                missing = ", ".join(sorted(missing_categories))
                raise RuntimeError(f"Required categories are missing: {missing}")

            for product_data in PRODUCTS:
                product = session.scalar(
                    select(Produit).where(Produit.nom == product_data["name"])
                )
                if product is None:
                    product = Produit(
                        nom=product_data["name"],
                        description=product_data["description"],
                        prix=product_data["price"],
                        categorie_id=categories[product_data["category"]].id,
                    )
                    session.add(product)
                    session.flush()
                    products_created += 1
                else:
                    if product.prix != product_data["price"]:
                        raise RuntimeError(
                            f"Existing product has a different price: {product_data['name']}"
                        )
                    if product.categorie_id != categories[product_data["category"]].id:
                        raise RuntimeError(
                            f"Existing product has a different category: {product_data['name']}"
                        )

                existing_variants = {
                    (variant.taille, variant.couleur)
                    for variant in session.scalars(
                        select(Variante).where(Variante.produit_id == product.id)
                    ).all()
                }
                for color in product_data["colors"]:
                    for size in SIZES:
                        if (size, color) in existing_variants:
                            continue
                        session.add(
                            Variante(
                                produit_id=product.id,
                                taille=size,
                                couleur=color,
                                quantite_disponible=TEMPORARY_STOCK,
                            )
                        )
                        variants_created += 1

        return products_created, variants_created
    finally:
        session.close()


if __name__ == "__main__":
    created_products, created_variants = seed_catalogue()
    print(f"products_created={created_products}")
    print(f"variants_created={created_variants}")
