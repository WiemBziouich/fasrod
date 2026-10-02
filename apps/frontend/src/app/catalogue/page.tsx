"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchProducts, type ProduitRead } from "@/lib/api";
import { CatalogueProductCard } from "@/components/catalogue-product-card";
import { catalogueProducts, formatPrice, getCatalogueProduct, getProductColors, getProductImage, getProductPrice } from "@/lib/catalogue";

type CatalogueFilters = {
  priceMin: string;
  priceMax: string;
  taille: string;
  couleur: string;
};

const initialFilters: CatalogueFilters = {
  priceMin: "",
  priceMax: "",
  taille: "",
  couleur: "",
};

const defaultProducts: ProduitRead[] = [];

export default function CataloguePage() {
  const [filters, setFilters] = useState<CatalogueFilters>(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<CatalogueFilters>(initialFilters);
  const [products, setProducts] = useState<ProduitRead[]>(defaultProducts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters]);

  useEffect(() => {
    let active = true;

    async function loadCatalogue() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchProducts({
          skip: 0,
          limit: 24,
          priceMin: debouncedFilters.priceMin ? Number(debouncedFilters.priceMin) : undefined,
          priceMax: debouncedFilters.priceMax ? Number(debouncedFilters.priceMax) : undefined,
          taille: debouncedFilters.taille || undefined,
          couleur: debouncedFilters.couleur || undefined,
        });

        if (!active) {
          return;
        }

        setProducts(result.items);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Impossible de charger le catalogue");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadCatalogue();

    return () => {
      active = false;
    };
  }, [debouncedFilters]);

  const legacyProducts = products.filter((product) => !getCatalogueProduct(product.nom));

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="border-b border-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Catalogue</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-text">Filtrer le catalogue</h1>
              <p className="mt-2 text-sm text-muted">Les filtres s’appliquent côté backend.</p>
            </div>
            <Link href="/" className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-text">
              Retour au feed
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Prix min</span>
            <input
              value={filters.priceMin}
              onChange={(event) => setFilters({ ...filters, priceMin: event.target.value })}
              inputMode="numeric"
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              placeholder="0"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Prix max</span>
            <input
              value={filters.priceMax}
              onChange={(event) => setFilters({ ...filters, priceMax: event.target.value })}
              inputMode="numeric"
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              placeholder="500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Taille</span>
            <input
              value={filters.taille}
              onChange={(event) => setFilters({ ...filters, taille: event.target.value })}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              placeholder="M"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Couleur</span>
            <input
              value={filters.couleur}
              onChange={(event) => setFilters({ ...filters, couleur: event.target.value })}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              placeholder="Noir"
            />
          </label>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text">{error}</div> : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            <div className="rounded-[30px] border border-border bg-surface-2 p-6 text-sm text-muted">
              Chargement du catalogue...
            </div>
          ) : (
            <>
              {catalogueProducts.map((product) => {
                const apiProduct = products.find((entry) => entry.nom === product.name);
                return <CatalogueProductCard key={product.name} product={product} productId={apiProduct?.id} image={apiProduct ? getProductImage(apiProduct) : undefined} />;
              })}
              {legacyProducts.map((product) => (
              <Link key={product.id} href={`/produits/${product.id}`}>
                <article className="overflow-hidden rounded-[30px] border border-border bg-surface-2 p-4">
                  <div className="aspect-[4/5] rounded-[24px] border border-border bg-surface p-4">
                    <div className="flex h-full flex-col justify-between rounded-[20px] border border-border bg-surface-2 p-4">
                      <span className="w-fit rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-text">
                        {product.collections[0]?.nom ?? "Featured"}
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted">Catalogue</p>
                        <h2 className="mt-2 text-2xl font-bold leading-tight text-text">{product.nom}</h2>
                        <p className="mt-2 text-lg font-semibold text-text">{formatPrice(getProductPrice(product))}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getProductColors(product).map((color) => <span key={color} className="rounded-full border border-border px-2 py-1 text-xs text-muted">{color}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
              ))}
            </>
          )}
        </div>
      </section>
    </main>
  );
}