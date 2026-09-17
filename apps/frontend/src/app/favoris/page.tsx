"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";

export default function FavorisPage() {
  const router = useRouter();
  const { client, isLoading: isAuthLoading } = useAuth();
  const { favorites, isLoading } = useFavorites();

  useEffect(() => {
    if (!isAuthLoading && !client) {
      router.replace("/connexion");
    }
  }, [client, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Vérification de la session...
        </div>
      </main>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="border-b border-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Favoris</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text">Produits sauvegardés</h1>
        </div>

        {isLoading ? (
          <div className="mt-4 rounded-[22px] border border-border bg-surface-2 p-5 text-sm text-muted">
            Chargement des favoris...
          </div>
        ) : favorites.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => (
              <article key={favorite.id} className="relative overflow-hidden rounded-[30px] border border-border bg-surface-2">
                <FavoriteToggleButton
                  productId={favorite.produit.id}
                  className="absolute right-4 top-4 z-10 rounded-full border border-border bg-surface-2 px-3 py-2 text-sm font-semibold text-text"
                />
                <Link href={`/produits/${favorite.produit.id}`} className="block p-4">
                  <div className="aspect-[4/5] border border-border bg-surface p-4">
                    <div className="flex h-full flex-col justify-between rounded-[24px] border border-border bg-surface-2 p-4">
                      <span className="w-fit rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-text">
                        {favorite.produit.collections[0]?.nom ?? "Featured"}
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted">Favori</p>
                        <h2 className="mt-2 text-2xl font-bold leading-tight text-text">{favorite.produit.nom}</h2>
                        <p className="mt-2 max-w-[24ch] text-sm text-muted">{favorite.produit.description}</p>
                      </div>
                      <p className="text-sm text-text">{favorite.produit.prix_promo ?? favorite.produit.prix}</p>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-border bg-surface-2 p-5 text-sm text-muted">
            Aucun favori pour le moment.
          </div>
        )}
      </section>
    </main>
  );
}