"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";
import {
  formatPrice,
  getProductImage,
  getProductPrice,
} from "@/lib/catalogue";

export default function FavorisPage() {
  const router = useRouter();

  const {
    client,
    isLoading: isAuthLoading,
  } = useAuth();

  const {
    favorites,
    isLoading,
  } = useFavorites();

  useEffect(() => {
    if (!isAuthLoading && !client) {
      router.replace("/connexion");
    }
  }, [client, isAuthLoading, router]);

  /* ---------------- SESSION LOADING ---------------- */

  if (isAuthLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-sm text-muted">
          Vérification de la session...
        </div>
      </main>
    );
  }

  if (!client) {
    return null;
  }

  /* ---------------- PAGE ---------------- */

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 pb-24 pt-4 sm:px-6 md:pb-10 lg:px-8">

      {/* HEADER */}

      <section className="rounded-[28px] border border-border bg-surface p-4 sm:p-5">

        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">

          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted">
              Favoris
            </p>

            <h1 className="mt-2 text-2xl font-bold leading-tight text-text sm:text-3xl">
              Produits sauvegardés
            </h1>

            {!isLoading ? (
              <p className="mt-1 text-xs text-muted">
                {favorites.length} produit
                {favorites.length > 1 ? "s" : ""} sauvegardé
                {favorites.length > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>

          {/* RETOUR */}

          <Link
            href="/"
            className="shrink-0 rounded-full border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-text transition hover:bg-surface"
          >
            ← Retour
          </Link>

        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/5] animate-pulse rounded-[22px] border border-border bg-surface-2"
              />
            ))}

          </div>
        ) : favorites.length > 0 ? (

          /* ---------------- PRODUCTS ---------------- */

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {favorites.map((favorite) => {
              const product = favorite.produit;

              const image = getProductImage(product);

              const price = getProductPrice(product);

              const category =
                product.categorie?.nom ?? "Produit";

              return (
                <article
                  key={favorite.id}
                  className="group overflow-hidden rounded-[22px] border border-border bg-surface-2 transition duration-200 hover:-translate-y-0.5 hover:border-text/30"
                >

                  {/* IMAGE */}

                  <div className="relative aspect-[4/5] overflow-hidden bg-surface">

                    {image ? (
                      <img
                        src={image.url}
                        alt={
                          image.alt_text ??
                          product.nom
                        }
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="rounded-full border border-border px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted">
                          Image à venir
                        </span>
                      </div>
                    )}

                    {/* CATEGORY */}

                    <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/75 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white shadow-sm backdrop-blur-sm">
                      {category}
                    </span>

                    {/* FAVORITE */}

                    <FavoriteToggleButton
                      productId={product.id}
                      aria-label="Retirer des favoris"
                      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-base text-white shadow-sm backdrop-blur-sm transition hover:bg-black"
                    />

                  </div>

                  {/* PRODUCT INFO */}

                  <Link
                    href={`/produits/${product.id}`}
                    className="block p-3"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <h2 className="min-w-0 text-sm font-bold leading-tight text-text">
                        {product.nom}
                      </h2>

                      <p className="shrink-0 text-sm font-semibold text-text">
                        {formatPrice(price)}
                      </p>

                    </div>

                    {/* COLORS */}

                    {product.variantes.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">

                        {Array.from(
                          new Set(
                            product.variantes.map(
                              (variant) =>
                                variant.couleur,
                            ),
                          ),
                        ).map((color) => (
                          <span
                            key={color}
                            className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted"
                          >
                            {color}
                          </span>
                        ))}

                      </div>
                    ) : null}

                  </Link>

                </article>
              );
            })}

          </div>

        ) : (

          /* ---------------- EMPTY STATE ---------------- */

          <div className="mt-4 rounded-[22px] border border-border bg-surface-2 px-6 py-14 text-center">

            <p className="text-3xl">
              ♡
            </p>

            <h2 className="mt-3 text-lg font-bold text-text">
              Aucun favori pour le moment
            </h2>

            <p className="mx-auto mt-1 max-w-[360px] text-sm text-muted">
              Sauvegarde les produits que tu aimes pour les retrouver facilement ici.
            </p>

            <Link
              href="/catalogue"
              className="mt-5 inline-flex rounded-full bg-text px-5 py-2.5 text-xs font-semibold text-bg transition hover:opacity-90"
            >
              Explorer le catalogue
            </Link>

          </div>
        )}

      </section>

    </main>
  );
}