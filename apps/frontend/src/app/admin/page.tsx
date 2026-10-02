"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  adjustAdminStock,
  createAdminCategory,
  createAdminCollection,
  createAdminProduct,
  createAdminPromotion,
  deleteAdminCategory,
  deleteAdminCollection,
  deleteAdminProduct,
  deleteAdminPromotion,
  deleteAdminImage,
  fetchAdminCategories,
  fetchAdminCollections,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminPromotions,
  updateAdminCategory,
  updateAdminCollection,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminPromotion,
  updateAdminImage,
  uploadAdminProductImage,
  type AdminCommandeRead,
  type AdminCategoryWrite,
  type AdminCollectionWrite,
  type AdminCommandeStatusUpdate,
  type AdminProduitWrite,
  type AdminPromotionWrite,
  type CategoryRead,
  type CollectionRead,
  type ProduitRead,
  type PromotionRead,
  type VarianteRead,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type AdminDashboardState = {
  products: ProduitRead[];
  orders: AdminCommandeRead[];
  categories: CategoryRead[];
  collections: CollectionRead[];
  promotions: PromotionRead[];
};

const initialState: AdminDashboardState = {
  products: [],
  orders: [],
  categories: [],
  collections: [],
  promotions: [],
};

const initialProductForm: AdminProduitWrite = {
  nom: "",
  description: "",
  prix: "",
  prix_promo: null,
  categorie_id: "",
  collection_ids: [],
  promotion_ids: [],
};

const initialCategoryForm: AdminCategoryWrite = { nom: "" };
const initialCollectionForm: AdminCollectionWrite = { nom: "", tag_style: "" };
const initialPromotionForm: AdminPromotionWrite = { type: "pourcentage", valeur: "", code: "", date_debut: "", date_fin: "", description: "" };
const initialStockForm = { varianteId: "", quantite_disponible: 0 };
const initialOrderStatusForm: AdminCommandeStatusUpdate = { statut: "nouvelle" };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parseIdList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinIds(values: string[]): string {
  return values.join(", ");
}

export default function AdminPage() {
  const router = useRouter();
  const { client, accessToken, isLoading } = useAuth();
  const [state, setState] = useState<AdminDashboardState>(initialState);
  const [error, setError] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [productForm, setProductForm] = useState<AdminProduitWrite>(initialProductForm);
  const [productMessage, setProductMessage] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryForm, setCategoryForm] = useState<AdminCategoryWrite>(initialCategoryForm);

  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [collectionForm, setCollectionForm] = useState<AdminCollectionWrite>(initialCollectionForm);

  const [selectedPromotionId, setSelectedPromotionId] = useState("");
  const [promotionForm, setPromotionForm] = useState<AdminPromotionWrite>(initialPromotionForm);

  const [selectedVariante, setSelectedVariante] = useState<VarianteRead | null>(null);
  const [stockForm, setStockForm] = useState(initialStockForm);

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderStatusForm, setOrderStatusForm] = useState<AdminCommandeStatusUpdate>(initialOrderStatusForm);
  const [imageProductId, setImageProductId] = useState("");
  const [imageColor, setImageColor] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageIsPrimary, setImageIsPrimary] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!client) {
      router.replace("/connexion");
      return;
    }

    if (!client.is_admin) {
      router.replace("/");
      return;
    }

    if (!accessToken) {
      return;
    }

    let active = true;

    async function loadDashboard() {
      try {
        const products = await fetchAdminProducts(accessToken);

        if (!active) {
          return;
        }

        setState((current) => ({ ...current, products }));
        setError(null);

        const [orders, categories, collections, promotions] = await Promise.all([
          fetchAdminOrders(accessToken),
          fetchAdminCategories(accessToken),
          fetchAdminCollections(accessToken),
          fetchAdminPromotions(accessToken),
        ]);

        if (!active) {
          return;
        }

        setState((current) => ({ ...current, orders, categories, collections, promotions }));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Impossible de charger le dashboard admin");
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [accessToken, client, isLoading, router]);

  const selectedProduct = useMemo(
    () => state.products.find((product) => product.id === selectedProductId) ?? null,
    [selectedProductId, state.products],
  );

  const selectedOrder = useMemo(
    () => state.orders.find((order) => order.id === selectedOrderId) ?? null,
    [selectedOrderId, state.orders],
  );

  const imageProduct = useMemo(
    () => state.products.find((product) => product.id === imageProductId) ?? null,
    [imageProductId, state.products],
  );
  const imageColors = useMemo(
    () => Array.from(new Set(imageProduct?.variantes.map((variant) => variant.couleur) ?? [])),
    [imageProduct],
  );

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[1200px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Vérification de la session...
        </section>
      </main>
    );
  }

  if (!client) {
    return null;
  }

  if (!client.is_admin) {
    return null;
  }

  async function reload() {
    if (!accessToken) return;
    const products = await fetchAdminProducts(accessToken);
    setState((current) => ({ ...current, products }));
    const [orders, categories, collections, promotions] = await Promise.all([
      fetchAdminOrders(accessToken),
      fetchAdminCategories(accessToken),
      fetchAdminCollections(accessToken),
      fetchAdminPromotions(accessToken),
    ]);
    setState((current) => ({ ...current, orders, categories, collections, promotions }));
  }

  async function handleProductSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    const payload = {
      ...productForm,
      collection_ids: productForm.collection_ids ?? [],
      promotion_ids: productForm.promotion_ids ?? [],
    };

    if (selectedProductId) {
      await updateAdminProduct(accessToken, selectedProductId, payload);
    } else {
      await createAdminProduct(accessToken, payload);
    }

    setSelectedProductId("");
    setProductForm(initialProductForm);
    setProductMessage("Produit enregistré.");
    await reload();
  }

  async function handleDeleteProduct(productId: string) {
    if (!accessToken) return;
    await deleteAdminProduct(accessToken, productId);
    if (selectedProductId === productId) {
      setSelectedProductId("");
      setProductForm(initialProductForm);
    }
    await reload();
  }

  async function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    if (selectedCategoryId) {
      await updateAdminCategory(accessToken, selectedCategoryId, categoryForm);
    } else {
      await createAdminCategory(accessToken, categoryForm);
    }
    setSelectedCategoryId("");
    setCategoryForm(initialCategoryForm);
    await reload();
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!accessToken) return;
    await deleteAdminCategory(accessToken, categoryId);
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId("");
      setCategoryForm(initialCategoryForm);
    }
    await reload();
  }

  async function handleCollectionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    if (selectedCollectionId) {
      await updateAdminCollection(accessToken, selectedCollectionId, collectionForm);
    } else {
      await createAdminCollection(accessToken, collectionForm);
    }
    setSelectedCollectionId("");
    setCollectionForm(initialCollectionForm);
    await reload();
  }

  async function handleDeleteCollection(collectionId: string) {
    if (!accessToken) return;
    await deleteAdminCollection(accessToken, collectionId);
    if (selectedCollectionId === collectionId) {
      setSelectedCollectionId("");
      setCollectionForm(initialCollectionForm);
    }
    await reload();
  }

  async function handlePromotionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    if (selectedPromotionId) {
      await updateAdminPromotion(accessToken, selectedPromotionId, promotionForm);
    } else {
      await createAdminPromotion(accessToken, promotionForm);
    }
    setSelectedPromotionId("");
    setPromotionForm(initialPromotionForm);
    await reload();
  }

  async function handleDeletePromotion(promotionId: string) {
    if (!accessToken) return;
    await deleteAdminPromotion(accessToken, promotionId);
    if (selectedPromotionId === promotionId) {
      setSelectedPromotionId("");
      setPromotionForm(initialPromotionForm);
    }
    await reload();
  }

  async function handleStockSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !stockForm.varianteId) return;
    await adjustAdminStock(accessToken, stockForm.varianteId, { quantite_disponible: stockForm.quantite_disponible });
    setStockForm(initialStockForm);
    setSelectedVariante(null);
    await reload();
  }

  async function handleOrderStatusSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !selectedOrderId) return;
    await updateAdminOrderStatus(accessToken, selectedOrderId, orderStatusForm);
    await reload();
  }

  async function handleImageUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !imageProductId || !imageFile) return;

    setIsUploadingImage(true);
    setImageMessage(null);
    try {
      await uploadAdminProductImage(accessToken, imageProductId, imageFile, {
        couleur: imageColor || undefined,
        estPrincipale: imageIsPrimary,
      });
      setImageFile(null);
      setImageIsPrimary(false);
      setImageMessage("Image téléversée avec succès.");
      await reload();
    } catch (uploadError) {
      setImageMessage(uploadError instanceof Error ? uploadError.message : "Échec du téléversement.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!accessToken) return;
    try {
      await deleteAdminImage(accessToken, imageId);
      setImageMessage("Image supprimée.");
      await reload();
    } catch (deleteError) {
      setImageMessage(deleteError instanceof Error ? deleteError.message : "Échec de la suppression.");
    }
  }

  async function handleSetPrimaryImage(imageId: string) {
    if (!accessToken) return;
    try {
      await updateAdminImage(accessToken, imageId, { est_principale: true });
      setImageMessage("Image principale mise à jour.");
      await reload();
    } catch (updateError) {
      setImageMessage(updateError instanceof Error ? updateError.message : "Échec de la mise à jour.");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="border-b border-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Dashboard Admin</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text">CRUD Fasrord</h1>
          <p className="mt-2 text-sm text-muted">Produits, catégories, collections, promotions, stock et commandes.</p>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text">{error}</div> : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Produits", state.products.length],
            ["Commandes", state.orders.length],
            ["Catégories", state.categories.length],
            ["Collections", state.collections.length],
            ["Promotions", state.promotions.length],
          ].map(([label, value]) => (
            <article key={label} className="rounded-[22px] border border-border bg-surface-2 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
              <p className="mt-2 text-3xl font-bold text-text">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <section className="rounded-[22px] border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold text-text">Produit</h2>
            <form className="mt-4 grid gap-3" onSubmit={handleProductSubmit}>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-muted">Produit à éditer</span>
                <select
                  value={selectedProductId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedProductId(value);
                    const product = state.products.find((item) => item.id === value);
                    if (product) {
                      setProductForm({
                        nom: product.nom,
                        description: product.description,
                        prix: product.prix,
                        prix_promo: product.prix_promo,
                        categorie_id: product.categorie.id,
                        collection_ids: product.collections.map((collection) => collection.id),
                        promotion_ids: product.promotions.map((promotion) => promotion.id),
                      });
                    } else {
                      setProductForm(initialProductForm);
                    }
                  }}
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none"
                >
                  <option value="">Nouveau produit</option>
                  {state.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nom}
                    </option>
                  ))}
                </select>
              </label>
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Nom" value={productForm.nom} onChange={(event) => setProductForm({ ...productForm, nom: event.target.value })} />
              <textarea className="min-h-28 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Prix" value={String(productForm.prix)} onChange={(event) => setProductForm({ ...productForm, prix: event.target.value })} />
                <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Prix promo" value={String(productForm.prix_promo ?? "")} onChange={(event) => setProductForm({ ...productForm, prix_promo: event.target.value || null })} />
              </div>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-muted">Catégorie</span>
                <select value={productForm.categorie_id} onChange={(event) => setProductForm({ ...productForm, categorie_id: event.target.value })} className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none">
                  <option value="">Choisir</option>
                  {state.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.nom}</option>
                  ))}
                </select>
              </label>
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Collection IDs séparés par virgule" value={joinIds(productForm.collection_ids ?? [])} onChange={(event) => setProductForm({ ...productForm, collection_ids: parseIdList(event.target.value) })} />
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Promotion IDs séparés par virgule" value={joinIds(productForm.promotion_ids ?? [])} onChange={(event) => setProductForm({ ...productForm, promotion_ids: parseIdList(event.target.value) })} />
              <div className="flex gap-2">
                <button type="submit" className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg">{selectedProductId ? "Mettre à jour" : "Créer"}</button>
                {selectedProductId ? <button type="button" onClick={async () => handleDeleteProduct(selectedProductId)} className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-text">Supprimer</button> : null}
              </div>
              {productMessage ? <p className="text-sm text-muted">{productMessage}</p> : null}
            </form>
          </section>

          <section className="rounded-[22px] border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold text-text">Stock / variantes</h2>
            <form className="mt-4 grid gap-3" onSubmit={handleStockSubmit}>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-muted">Variante</span>
                <select
                  value={stockForm.varianteId}
                  onChange={(event) => {
                    const variant = state.products.flatMap((product) => product.variantes).find((item) => item.id === event.target.value) ?? null;
                    setSelectedVariante(variant);
                    setStockForm({ varianteId: event.target.value, quantite_disponible: variant?.quantite_disponible ?? 0 });
                  }}
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none"
                >
                  <option value="">Choisir</option>
                  {state.products.flatMap((product) => product.variantes).map((variant) => (
                    <option key={variant.id} value={variant.id}>{variant.taille} · {variant.couleur}</option>
                  ))}
                </select>
              </label>
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" type="number" min={0} value={stockForm.quantite_disponible} onChange={(event) => setStockForm({ ...stockForm, quantite_disponible: Number(event.target.value) })} placeholder="Quantité en stock" />
              <button type="submit" className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg">Ajuster le stock</button>
            </form>
          </section>

          <section className="rounded-[22px] border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold text-text">Images produit</h2>
            <form className="mt-4 grid gap-3" onSubmit={handleImageUpload}>
              <select
                value={imageProductId}
                onChange={(event) => {
                  setImageProductId(event.target.value);
                  setImageColor("");
                  setImageMessage(null);
                }}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none"
              >
                <option value="">Choisir un produit</option>
                {state.products.map((product) => <option key={product.id} value={product.id}>{product.nom}</option>)}
              </select>
              <select
                value={imageColor}
                onChange={(event) => setImageColor(event.target.value)}
                disabled={!imageProduct}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none disabled:opacity-50"
              >
                <option value="">Image produit-wide</option>
                {imageColors.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted"
              />
              <label className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" checked={imageIsPrimary} onChange={(event) => setImageIsPrimary(event.target.checked)} />
                Définir comme image principale
              </label>
              <button type="submit" disabled={isUploadingImage || !imageProductId || !imageFile} className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-50">
                {isUploadingImage ? "Téléversement..." : "Téléverser l’image"}
              </button>
              {imageMessage ? <p className="text-sm text-muted">{imageMessage}</p> : null}
            </form>

            {imageProduct ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {imageProduct.images.length > 0 ? imageProduct.images.map((image) => (
                  <article key={image.id} className="rounded-2xl border border-border bg-surface p-3">
                    <img src={image.url} alt={image.alt_text ?? imageProduct.nom} className="aspect-[4/5] w-full rounded-xl object-cover" />
                    <p className="mt-2 text-xs text-muted">{image.couleur ?? "Produit-wide"}{image.est_principale ? " · Principale" : ""}</p>
                    <div className="mt-2 flex gap-2">
                      {!image.est_principale ? <button type="button" onClick={() => void handleSetPrimaryImage(image.id)} className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-text">Principale</button> : null}
                      <button type="button" onClick={() => void handleDeleteImage(image.id)} className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-text">Supprimer</button>
                    </div>
                  </article>
                )) : <p className="text-sm text-muted">Aucune image pour ce produit.</p>}
              </div>
            ) : null}
          </section>

          <section className="rounded-[22px] border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold text-text">Catégories</h2>
            <form className="mt-4 grid gap-3" onSubmit={async (event) => {
              event.preventDefault();
              if (!accessToken) return;
              if (selectedCategoryId) {
                await updateAdminCategory(accessToken, selectedCategoryId, categoryForm);
              } else {
                await createAdminCategory(accessToken, categoryForm);
              }
              setSelectedCategoryId("");
              setCategoryForm(initialCategoryForm);
              await reload();
            }}>
              <select value={selectedCategoryId} onChange={(event) => {
                const value = event.target.value;
                setSelectedCategoryId(value);
                setCategoryForm({ nom: state.categories.find((item) => item.id === value)?.nom ?? "" });
              }} className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none">
                <option value="">Nouvelle catégorie</option>
                {state.categories.map((category) => <option key={category.id} value={category.id}>{category.nom}</option>)}
              </select>
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Nom" value={categoryForm.nom} onChange={(event) => setCategoryForm({ nom: event.target.value })} />
              <div className="flex gap-2">
                <button type="submit" className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg">{selectedCategoryId ? "Mettre à jour" : "Créer"}</button>
                {selectedCategoryId ? <button type="button" onClick={async () => { if (!accessToken) return; await deleteAdminCategory(accessToken, selectedCategoryId); setSelectedCategoryId(""); setCategoryForm(initialCategoryForm); await reload(); }} className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-text">Supprimer</button> : null}
              </div>
            </form>
          </section>

          <section className="rounded-[22px] border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold text-text">Collections</h2>
            <form className="mt-4 grid gap-3" onSubmit={handleCollectionSubmit}>
              <select value={selectedCollectionId} onChange={(event) => {
                const value = event.target.value;
                setSelectedCollectionId(value);
                const collection = state.collections.find((item) => item.id === value);
                setCollectionForm({ nom: collection?.nom ?? "", tag_style: collection?.tag_style ?? "" });
              }} className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none">
                <option value="">Nouvelle collection</option>
                {state.collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.nom}</option>)}
              </select>
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Nom" value={collectionForm.nom} onChange={(event) => setCollectionForm({ ...collectionForm, nom: event.target.value })} />
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Tag style" value={collectionForm.tag_style ?? ""} onChange={(event) => setCollectionForm({ ...collectionForm, tag_style: event.target.value || null })} />
              <div className="flex gap-2">
                <button type="submit" className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg">{selectedCollectionId ? "Mettre à jour" : "Créer"}</button>
                {selectedCollectionId ? <button type="button" onClick={async () => { if (!accessToken) return; await deleteAdminCollection(accessToken, selectedCollectionId); setSelectedCollectionId(""); setCollectionForm(initialCollectionForm); await reload(); }} className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-text">Supprimer</button> : null}
              </div>
            </form>
          </section>

          <section className="rounded-[22px] border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold text-text">Promotions</h2>
            <form className="mt-4 grid gap-3" onSubmit={handlePromotionSubmit}>
              <select value={selectedPromotionId} onChange={(event) => {
                const value = event.target.value;
                setSelectedPromotionId(value);
                const promotion = state.promotions.find((item) => item.id === value);
                setPromotionForm({
                  type: promotion?.type ?? "pourcentage",
                  valeur: promotion?.valeur ?? "",
                  code: promotion?.code ?? "",
                  date_debut: promotion?.date_debut ?? "",
                  date_fin: promotion?.date_fin ?? "",
                  description: promotion?.description ?? "",
                });
              }} className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none">
                <option value="">Nouvelle promotion</option>
                {state.promotions.map((promotion) => <option key={promotion.id} value={promotion.id}>{promotion.code ?? promotion.id}</option>)}
              </select>
              <select value={promotionForm.type} onChange={(event) => setPromotionForm({ ...promotionForm, type: event.target.value as AdminPromotionWrite["type"] })} className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none">
                <option value="pourcentage">Pourcentage</option>
                <option value="montant_fixe">Montant fixe</option>
              </select>
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Valeur" value={String(promotionForm.valeur)} onChange={(event) => setPromotionForm({ ...promotionForm, valeur: event.target.value })} />
              <input className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Code" value={promotionForm.code ?? ""} onChange={(event) => setPromotionForm({ ...promotionForm, code: event.target.value || null })} />
              <input type="date" className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" value={promotionForm.date_debut ?? ""} onChange={(event) => setPromotionForm({ ...promotionForm, date_debut: event.target.value || null })} />
              <input type="date" className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" value={promotionForm.date_fin ?? ""} onChange={(event) => setPromotionForm({ ...promotionForm, date_fin: event.target.value || null })} />
              <textarea className="min-h-24 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none" placeholder="Description" value={promotionForm.description ?? ""} onChange={(event) => setPromotionForm({ ...promotionForm, description: event.target.value || null })} />
              <div className="flex gap-2">
                <button type="submit" className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg">{selectedPromotionId ? "Mettre à jour" : "Créer"}</button>
                {selectedPromotionId ? <button type="button" onClick={async () => { if (!accessToken) return; await deleteAdminPromotion(accessToken, selectedPromotionId); setSelectedPromotionId(""); setPromotionForm(initialPromotionForm); await reload(); }} className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-text">Supprimer</button> : null}
              </div>
            </form>
          </section>

          <section className="rounded-[22px] border border-border bg-surface-2 p-4 xl:col-span-2">
            <h2 className="text-lg font-semibold text-text">Commandes</h2>
            <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <form className="grid gap-3" onSubmit={handleOrderStatusSubmit}>
                <select value={selectedOrderId} onChange={(event) => {
                  const value = event.target.value;
                  setSelectedOrderId(value);
                  const order = state.orders.find((item) => item.id === value);
                  setOrderStatusForm({ statut: order?.statut ?? "nouvelle" });
                }} className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none">
                  <option value="">Choisir une commande</option>
                  {state.orders.map((order) => <option key={order.id} value={order.id}>{order.id.slice(0, 8)} · {order.statut}</option>)}
                </select>
                <select value={orderStatusForm.statut} onChange={(event) => setOrderStatusForm({ statut: event.target.value })} className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none">
                  {[
                    "nouvelle",
                    "confirmee",
                    "preparation",
                    "prete_pour_navex",
                    "expediee",
                    "livree",
                    "annulee",
                  ].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button type="submit" className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg">Mettre à jour le statut</button>
                {selectedOrder ? <p className="text-sm text-muted">Commande sélectionnée: {selectedOrder.id}</p> : null}
              </form>

              <div className="space-y-3">
                {state.orders.slice(0, 10).map((order) => (
                  <article key={order.id} className="rounded-[18px] border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text">Commande {order.id.slice(0, 8)}</p>
                        <p className="mt-1 text-xs text-muted">Client {order.client_id.slice(0, 8)} · {formatDate(order.cree_le)}</p>
                      </div>
                      <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-text">{order.statut}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}