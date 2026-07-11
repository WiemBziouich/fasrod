export type CollectionRead = {
  id: string;
  nom: string;
  tag_style: string | null;
};

export type PromotionRead = {
  id: string;
  type: string;
  valeur: string;
  code: string | null;
  date_debut: string | null;
  date_fin: string | null;
  description: string | null;
};

export type VarianteRead = {
  id: string;
  taille: string;
  couleur: string;
  quantite_disponible: number;
};

export type ProduitRead = {
  id: string;
  nom: string;
  description: string;
  prix: string;
  prix_promo: string | null;
  categorie: {
    id: string;
    nom: string;
  };
  collections: CollectionRead[];
  variantes: VarianteRead[];
  promotions: PromotionRead[];
};

export type ProductListResponse = {
  items: ProduitRead[];
  total: number;
  skip: number;
  limit: number;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchCollections() {
  return getJson<CollectionRead[]>("/collections");
}

export function fetchActivePromotions() {
  return getJson<PromotionRead[]>("/promotions/active");
}

export function fetchProducts(params: { skip?: number; limit?: number; collectionId?: string; categorieId?: string }) {
  const searchParams = new URLSearchParams();
  searchParams.set("skip", String(params.skip ?? 0));
  searchParams.set("limit", String(params.limit ?? 20));

  if (params.collectionId) {
    searchParams.set("collection_id", params.collectionId);
  }

  if (params.categorieId) {
    searchParams.set("categorie_id", params.categorieId);
  }

  return getJson<ProductListResponse>(`/produits?${searchParams.toString()}`);
}

export function fetchProductById(productId: string) {
  return getJson<ProduitRead>(`/produits/${productId}`);
}