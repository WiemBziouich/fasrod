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

const SIZE_ORDER = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "2xl", "xxxl", "3xl"];

export function sortSizes(sizes: string[]): string[] {
  const rank = (size: string): number => {
    const index = SIZE_ORDER.indexOf(size.trim().toLowerCase());
    if (index >= 0) {
      return index;
    }
    const numeric = Number(size);
    return Number.isNaN(numeric) ? 1000 : 100 + numeric;
  };

  return [...sizes].sort((left, right) => {
    const diff = rank(left) - rank(right);
    return diff !== 0 ? diff : left.localeCompare(right);
  });
}

// Toutes les images à afficher dans la galerie pour une couleur donnée.
// Inclut : images de cette couleur, images liées à une variante de cette couleur,
// et images génériques (sans couleur ni variante). Si rien ne correspond, renvoie toutes les images.
export function getProductImages(
  product: Pick<ProduitRead, "images" | "variantes">,
  color?: string,
): ProduitImageRead[] {
  const ordered = [...product.images].sort((left, right) => left.ordre - right.ordre);

  if (!color) {
    return ordered;
  }

  const variantIds = new Set(
    product.variantes.filter((variant) => variant.couleur === color).map((variant) => variant.id),
  );

  const matching = ordered.filter(
    (image) =>
      image.couleur === color ||
      (image.variante_id !== null && variantIds.has(image.variante_id)) ||
      (image.couleur === null && image.variante_id === null),
  );

  return matching.length > 0 ? matching : ordered;
}