import type { ProduitImageRead, ProduitRead } from "@/lib/api";

export type CatalogueProduct = {
  name: string;
  price: number;
  colors: string[];
  kind: "baggy" | "tshirt" | "set";
  image?: string;
};

export const catalogueProducts: CatalogueProduct[] = [
  { name: "EXTRA Baggy Jogger", price: 35, colors: ["Noir", "Gris", "Rose"], kind: "baggy" },
  { name: "Camo Baggy", price: 57, colors: ["Beige", "Vert", "Marron"], kind: "baggy" },
  { name: "FAMILY Baggy Jogger", price: 42, colors: ["Noir", "Gris", "Gris charbon"], kind: "baggy" },
  { name: "Baggy Jogger", price: 35, colors: ["Gris", "Noir", "Gris charbon", "Rose", "Beige", "Blanc"], kind: "baggy" },
  { name: "Fasrod Baggy Jogger", price: 35, colors: ["Noir", "Gris", "Gris charbon"], kind: "baggy" },
  { name: "California Set", price: 58, colors: ["Rose", "Bleu ciel", "Bleu marine", "Noir"], kind: "set" },
  { name: "Fasrod Set", price: 58, colors: ["Noir", "Gris"], kind: "set" },
  { name: "Bape T-shirt", price: 29, colors: ["Noir", "Rose", "Bleu"], kind: "tshirt" },
  { name: "Aura T-shirt", price: 29, colors: ["Noir", "Blanc"], kind: "tshirt" },
  { name: "STWD T-shirt", price: 29, colors: ["Gris", "Bleu", "Rose"], kind: "tshirt" },
];

export function getCatalogueProduct(name: string): CatalogueProduct | undefined {
  return catalogueProducts.find((product) => product.name === name);
}

export function getProductPrice(product: Pick<ProduitRead, "nom" | "prix" | "prix_promo">): number {
  const catalogueProduct = getCatalogueProduct(product.nom);
  if (catalogueProduct) {
    return catalogueProduct.price;
  }

  return Number(product.prix_promo ?? product.prix);
}

export function getProductColors(product: Pick<ProduitRead, "nom" | "variantes">): string[] {
  if (product.variantes.length > 0) {
    return Array.from(new Set(product.variantes.map((variant) => variant.couleur)));
  }

  const catalogueProduct = getCatalogueProduct(product.nom);
  if (catalogueProduct) {
    return catalogueProduct.colors;
  }

  return [];
}

export function formatPrice(price: number): string {
  return `${price} DT`;
}

export function getProductImage(
  product: Pick<ProduitRead, "images">,
  color?: string,
  variantId?: string,
): ProduitImageRead | undefined {
  const orderedImages = [...product.images].sort((left, right) => left.ordre - right.ordre);

  if (variantId) {
    const variantImage = orderedImages.find((image) => image.variante_id === variantId);
    if (variantImage) {
      return variantImage;
    }
  }

  if (color) {
    const colorImage = orderedImages.find((image) => image.variante_id === null && image.couleur === color);
    if (colorImage) {
      return colorImage;
    }

    return orderedImages.find((image) => image.variante_id === null && image.couleur === null);
  }

  return (
    orderedImages.find((image) => image.variante_id === null && image.est_principale) ??
    orderedImages.find((image) => image.variante_id === null) ??
    orderedImages[0]
  );
}