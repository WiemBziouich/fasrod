export type CollectionRead = {
  id: string;
  nom: string;
  tag_style: string | null;
};

export type CategoryRead = {
  id: string;
  nom: string;
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

export type LigneCommandeRead = {
  id: string;
  produit_id: string;
  variante_id: string;
  quantite: number;
  prix_unitaire: string;
};

export type CommandeRead = {
  id: string;
  statut: string;
  gouvernorat: string;
  ville: string;
  adresse: string;
  commentaire: string | null;
  cree_le: string;
};

export type CommandeDetailRead = CommandeRead & {
  lignes: LigneCommandeRead[];
};

export type FavoriRead = {
  id: string;
  produit: ProduitRead;
};

export type CommandeCreatePayload = {
  gouvernorat: string;
  ville: string;
  adresse: string;
  commentaire?: string | null;
  lignes: { variante_id: string; quantite: number }[];
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  client: {
    id: string;
    nom: string;
    telephone: string;
    telephone_secondaire: string | null;
    email: string;
    is_admin: boolean;
  };
};

export type AuthLoginPayload = {
  identifier: string;
  password: string;
};

export type AuthRegisterPayload = {
  nom: string;
  telephone: string;
  telephone_secondaire?: string | null;
  email: string;
  password: string;
};

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function resolveApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (typeof window === "undefined") {
    return configuredBaseUrl ?? "http://localhost:8000/api/v1";
  }

  if (!configuredBaseUrl) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }

  try {
    const configuredHost = new URL(configuredBaseUrl).hostname;
    if (configuredHost === "localhost" || configuredHost === "127.0.0.1") {
      return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
    }
  } catch {
    // Keep the configured URL if it cannot be parsed.
  }

  return configuredBaseUrl;
}

const baseUrl = resolveApiBaseUrl();

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

// Les endpoints /commandes exigent un access token (voir app/api/deps.py côté backend) :
// pas d'UI de login pour l'instant, donc le token est passé explicitement par l'appelant
// plutôt que lu depuis un store global qui n'existe pas encore.
async function requestJsonWithAuth<T>(
  path: string,
  accessToken: string,
  init?: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; expectJson?: boolean },
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = `Request failed for ${path}: ${response.status}`;

    try {
      const errorPayload = (await response.json()) as { detail?: string };
      if (errorPayload.detail) {
        detail = errorPayload.detail;
      }
    } catch {
      // Keep the generic HTTP status message when the backend does not return JSON.
    }

    throw new ApiError(response.status, detail);
  }

  if (init?.expectJson === false) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function requestJsonWithCookies<T>(path: string, init: { method: "POST"; body: unknown }): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(init.body),
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = `Request failed for ${path}: ${response.status}`;

    try {
      const errorPayload = (await response.json()) as { detail?: string };
      if (errorPayload.detail) {
        detail = errorPayload.detail;
      }
    } catch {
      // Keep the generic HTTP status message when the backend does not return JSON.
    }

    throw new ApiError(response.status, detail);
  }

  return (await response.json()) as T;
}

export function fetchCollections() {
  return getJson<CollectionRead[]>("/collections");
}

export function fetchActivePromotions() {
  return getJson<PromotionRead[]>("/promotions/active");
}

export function fetchProducts(params: {
  skip?: number;
  limit?: number;
  collectionId?: string;
  categorieId?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  taille?: string;
  couleur?: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("skip", String(params.skip ?? 0));
  searchParams.set("limit", String(params.limit ?? 20));

  if (params.collectionId) {
    searchParams.set("collection_id", params.collectionId);
  }

  if (params.categorieId) {
    searchParams.set("categorie_id", params.categorieId);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.priceMin !== undefined) {
    searchParams.set("price_min", String(params.priceMin));
  }

  if (params.priceMax !== undefined) {
    searchParams.set("price_max", String(params.priceMax));
  }

  if (params.taille) {
    searchParams.set("taille", params.taille);
  }

  if (params.couleur) {
    searchParams.set("couleur", params.couleur);
  }

  return getJson<ProductListResponse>(`/produits?${searchParams.toString()}`);
}

export function fetchProductById(productId: string) {
  return getJson<ProduitRead>(`/produits/${productId}`);
}

export function createCommande(payload: CommandeCreatePayload, accessToken: string) {
  return requestJsonWithAuth<CommandeDetailRead>("/commandes", accessToken, {
    method: "POST",
    body: payload,
  });
}

export function fetchMesCommandes(accessToken: string) {
  return requestJsonWithAuth<CommandeRead[]>("/commandes", accessToken);
}

export function fetchCommandeById(commandeId: string, accessToken: string) {
  return requestJsonWithAuth<CommandeDetailRead>(`/commandes/${commandeId}`, accessToken);
}

export function login(payload: AuthLoginPayload) {
  return requestJsonWithCookies<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function register(payload: AuthRegisterPayload) {
  return requestJsonWithCookies<AuthTokenResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function fetchMesFavoris(accessToken: string) {
  return requestJsonWithAuth<FavoriRead[]>('/favoris', accessToken);
}

export function addFavori(produitId: string, accessToken: string) {
  return requestJsonWithAuth<FavoriRead>(`/favoris/${produitId}`, accessToken, {
    method: 'POST',
  });
}

export function removeFavori(produitId: string, accessToken: string) {
  return requestJsonWithAuth<void>(`/favoris/${produitId}`, accessToken, {
    method: 'DELETE',
    expectJson: false,
  });
}

export type AdminCommandeRead = {
  id: string;
  statut: string;
  client_id: string;
  gouvernorat: string;
  ville: string;
  adresse: string;
  commentaire: string | null;
  cree_le: string;
};

export type AdminProduitWrite = {
  nom: string;
  description: string;
  prix: string | number;
  prix_promo?: string | number | null;
  categorie_id: string;
  collection_ids?: string[];
  promotion_ids?: string[];
};

export type AdminCategoryWrite = { nom: string };
export type AdminCollectionWrite = { nom: string; tag_style?: string | null };
export type AdminPromotionWrite = {
  type: PromotionRead["type"];
  valeur: string | number;
  code?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  description?: string | null;
};
export type AdminVarianteWrite = { taille: string; couleur: string; quantite_disponible: number };
export type AdminStockAdjustWrite = { quantite_disponible: number };
export type AdminCommandeStatusUpdate = { statut: string };

export function fetchAdminProducts(accessToken: string) {
  return requestJsonWithAuth<ProduitRead[]>('/admin/produits', accessToken);
}

export function fetchAdminOrders(accessToken: string) {
  return requestJsonWithAuth<AdminCommandeRead[]>('/admin/commandes', accessToken);
}

export function fetchAdminCategories(accessToken: string) {
  return requestJsonWithAuth<CategoryRead[]>('/admin/categories', accessToken);
}

export function fetchAdminCollections(accessToken: string) {
  return requestJsonWithAuth<CollectionRead[]>('/admin/collections', accessToken);
}

export function fetchAdminPromotions(accessToken: string) {
  return requestJsonWithAuth<PromotionRead[]>('/admin/promotions', accessToken);
}

export function createAdminProduct(accessToken: string, payload: AdminProduitWrite) {
  return requestJsonWithAuth<ProduitRead>('/admin/produits', accessToken, { method: 'POST', body: payload });
}

export function updateAdminProduct(accessToken: string, productId: string, payload: AdminProduitWrite) {
  return requestJsonWithAuth<ProduitRead>(`/admin/produits/${productId}`, accessToken, { method: 'PATCH', body: payload });
}

export function deleteAdminProduct(accessToken: string, productId: string) {
  return requestJsonWithAuth<void>(`/admin/produits/${productId}`, accessToken, { method: 'DELETE', expectJson: false });
}

export function addAdminVariante(accessToken: string, productId: string, payload: AdminVarianteWrite) {
  return requestJsonWithAuth<VarianteRead>(`/admin/produits/${productId}/variantes`, accessToken, { method: 'POST', body: payload });
}

export function updateAdminVariante(accessToken: string, varianteId: string, payload: AdminVarianteWrite) {
  return requestJsonWithAuth<VarianteRead>(`/admin/variantes/${varianteId}`, accessToken, { method: 'PATCH', body: payload });
}

export function adjustAdminStock(accessToken: string, varianteId: string, payload: AdminStockAdjustWrite) {
  return requestJsonWithAuth<VarianteRead>(`/admin/variantes/${varianteId}/stock`, accessToken, { method: 'PATCH', body: payload });
}

export function createAdminCategory(accessToken: string, payload: AdminCategoryWrite) {
  return requestJsonWithAuth<CategoryRead>('/admin/categories', accessToken, { method: 'POST', body: payload });
}

export function updateAdminCategory(accessToken: string, categoryId: string, payload: AdminCategoryWrite) {
  return requestJsonWithAuth<CategoryRead>(`/admin/categories/${categoryId}`, accessToken, { method: 'PATCH', body: payload });
}

export function deleteAdminCategory(accessToken: string, categoryId: string) {
  return requestJsonWithAuth<void>(`/admin/categories/${categoryId}`, accessToken, { method: 'DELETE', expectJson: false });
}

export function createAdminCollection(accessToken: string, payload: AdminCollectionWrite) {
  return requestJsonWithAuth<CollectionRead>('/admin/collections', accessToken, { method: 'POST', body: payload });
}

export function updateAdminCollection(accessToken: string, collectionId: string, payload: AdminCollectionWrite) {
  return requestJsonWithAuth<CollectionRead>(`/admin/collections/${collectionId}`, accessToken, { method: 'PATCH', body: payload });
}

export function deleteAdminCollection(accessToken: string, collectionId: string) {
  return requestJsonWithAuth<void>(`/admin/collections/${collectionId}`, accessToken, { method: 'DELETE', expectJson: false });
}

export function createAdminPromotion(accessToken: string, payload: AdminPromotionWrite) {
  return requestJsonWithAuth<PromotionRead>('/admin/promotions', accessToken, { method: 'POST', body: payload });
}

export function updateAdminPromotion(accessToken: string, promotionId: string, payload: AdminPromotionWrite) {
  return requestJsonWithAuth<PromotionRead>(`/admin/promotions/${promotionId}`, accessToken, { method: 'PATCH', body: payload });
}

export function deleteAdminPromotion(accessToken: string, promotionId: string) {
  return requestJsonWithAuth<void>(`/admin/promotions/${promotionId}`, accessToken, { method: 'DELETE', expectJson: false });
}

export function updateAdminOrderStatus(accessToken: string, orderId: string, payload: AdminCommandeStatusUpdate) {
  return requestJsonWithAuth<AdminCommandeRead>(`/admin/commandes/${orderId}/statut`, accessToken, { method: 'PATCH', body: payload });
}