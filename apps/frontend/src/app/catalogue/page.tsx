"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchProducts, type ProduitRead } from "@/lib/api";
import { CatalogueProductCard } from "@/components/catalogue-product-card";

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

export default function CataloguePage() {
  const [filters, setFilters] = useState<CatalogueFilters>(initialFilters);
  const [debouncedFilters, setDebouncedFilters] =
    useState<CatalogueFilters>(initialFilters);

  const [products, setProducts] = useState<ProduitRead[]>([]);
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
          priceMin: debouncedFilters.priceMin
            ? Number(debouncedFilters.priceMin)
            : undefined,
          priceMax: debouncedFilters.priceMax
            ? Number(debouncedFilters.priceMax)
            : undefined,
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

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger le catalogue",
        );
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 py-4 pb-24 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4 sm:p-5">
        {/* HEADER */}
        <div className="border-b border-border pb-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted">
            Catalogue
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-tight text-text sm:text-3xl">
                Filtrer le catalogue
              </h1>

              <p className="mt-1 text-xs text-muted sm:text-sm">
                Trouve rapidement les pièces qui te correspondent.
              </p>
            </div>

            <Link
              href="/"
              className="w-fit rounded-full border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-text transition hover:bg-surface"
            >
              Retour au feed
            </Link>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted">
              Prix min
            </span>

            <input
              value={filters.priceMin}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  priceMin: event.target.value,
                })
              }
              inputMode="numeric"
              type="number"
              min="0"
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none transition focus:border-text"
              placeholder="0"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted">
              Prix max
            </span>

            <input
              value={filters.priceMax}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  priceMax: event.target.value,
                })
              }
              inputMode="numeric"
              type="number"
              min="0"
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none transition focus:border-text"
              placeholder="500"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted">
              Taille
            </span>

            <input
              value={filters.taille}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  taille: event.target.value,
                })
              }
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none transition focus:border-text"
              placeholder="M"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted">
              Couleur
            </span>

            <input
              value={filters.couleur}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  couleur: event.target.value,
                })
              }
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none transition focus:border-text"
              placeholder="Noir"
            />
          </label>
        </div>

        {/* ERROR */}
        {error ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text">
            {error}
          </div>
        ) : null}

        {/* RESULT COUNT */}
        {!isLoading && !error ? (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {products.length} produit{products.length > 1 ? "s" : ""}
            </p>
          </div>
        ) : null}

        {/* PRODUCTS */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] animate-pulse rounded-[22px] border border-border bg-surface-2"
              />
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full rounded-[22px] border border-border bg-surface-2 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-text">
                Aucun produit trouvé
              </p>

              <p className="mt-1 text-xs text-muted">
                Essaie de modifier les filtres.
              </p>
            </div>
          ) : (
            products.map((product) => (
              <CatalogueProductCard
                key={product.id}
                productId={product.id}
                product={product}
                categoryLabel={product.categorie.nom}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}