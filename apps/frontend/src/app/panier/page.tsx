"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fetchProductById } from "@/lib/api";
import { getProductImage } from "@/lib/catalogue";
import { useCart } from "@/lib/cart-context";

function parsePrice(value: string): number {
  const normalized = value
    .replace(/[^0-9,.-]/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} DT`;
}

const SHIPPING_FEE = 8;

export default function CartPage() {
  const {
    items,
    total,
    updateQuantity,
    removeItem,
  } = useCart();

  const orderTotal = total + SHIPPING_FEE;

  const [resolvedImages, setResolvedImages] = useState<
    Record<string, string>
  >({});

  /*
   * Resolve les images des anciens articles du panier.
   *
   * Les nouveaux articles auront directement leur image.
   * Pour les anciens articles qui n'en ont pas encore,
   * on récupère le produit depuis l'API.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadMissingImages() {
      const itemsWithoutImages = items.filter(
        (item) =>
          !item.image &&
          !resolvedImages[item.varianteId],
      );

      if (itemsWithoutImages.length === 0) {
        return;
      }

      const results = await Promise.all(
        itemsWithoutImages.map(async (item) => {
          try {
            const product = await fetchProductById(
              item.produitId,
            );

            const image = getProductImage(
              product,
              item.couleur,
              item.varianteId,
            );

            return {
              varianteId: item.varianteId,
              url: image?.url ?? null,
            };
          } catch {
            return {
              varianteId: item.varianteId,
              url: null,
            };
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setResolvedImages((current) => {
        const next = { ...current };

        for (const result of results) {
          if (result.url) {
            next[result.varianteId] = result.url;
          }
        }

        return next;
      });
    }

    loadMissingImages();

    return () => {
      cancelled = true;
    };
  }, [items, resolvedImages]);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full rounded-[28px] border border-border bg-surface p-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">
            Panier vide
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-text">
            Aucun article pour le moment.
          </h1>

          <p className="mt-3 text-sm text-muted">
            Ajoute un produit depuis la fiche produit.
          </p>

          <Link
            href="/catalogue"
            className="mt-5 inline-flex rounded-full border border-border bg-text px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
          >
            Voir le catalogue
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1200px] px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4 sm:p-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-muted">
              Panier
            </p>

            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
              Tes articles
            </h1>

            <p className="mt-2 text-sm text-muted">
              {items.length}{" "}
              {items.length === 1
                ? "article"
                : "articles"}{" "}
              dans ton panier
            </p>
          </div>

          <Link
            href="/catalogue"
            className="inline-flex w-fit items-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-2"
          >
            ← Continuer shopping
          </Link>
        </div>

        {/* CONTENT */}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">

          {/* ITEMS */}

          <div className="space-y-3">

            {items.map((item) => {
              const image =
                item.image ??
                resolvedImages[item.varianteId];

              const unitPrice = parsePrice(item.prix);

              const lineTotal =
                unitPrice * item.quantite;

              return (
                <article
                  key={item.varianteId}
                  className="overflow-hidden rounded-[24px] border border-border bg-surface-2"
                >
                  <div className="flex flex-col gap-4 p-3 sm:flex-row sm:p-4">

                    {/* IMAGE */}

                    <Link
                      href={`/produits/${item.produitId}`}
                      className="block w-full shrink-0 sm:w-32"
                    >
                      <div className="aspect-[4/5] overflow-hidden rounded-[18px] border border-border bg-surface">
                        {image ? (
                          <img
                            src={image}
                            alt={item.nom}
                            className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] uppercase tracking-[0.2em] text-muted">
                            Image à venir
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* INFO */}

                    <div className="flex min-w-0 flex-1 flex-col">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">
                          <Link
                            href={`/produits/${item.produitId}`}
                            className="block"
                          >
                            <h2 className="text-lg font-bold text-text transition hover:opacity-70">
                              {item.nom}
                            </h2>
                          </Link>

                          <p className="mt-1 text-sm text-muted">
                            Taille {item.taille}
                            {" · "}
                            Couleur {item.couleur}
                          </p>
                        </div>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.varianteId)
                          }
                          className="shrink-0 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:border-text hover:text-text"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">

                        {/* QUANTITY */}

                        <div>
                          <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted">
                            Quantité
                          </p>

                          <div className="flex items-center gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.varianteId,
                                  item.quantite - 1,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-semibold text-text transition hover:bg-surface"
                              aria-label={`Diminuer la quantité de ${item.nom}`}
                            >
                              −
                            </button>

                            <span className="flex h-9 min-w-9 items-center justify-center text-sm font-semibold text-text">
                              {item.quantite}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.varianteId,
                                  item.quantite + 1,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-semibold text-text transition hover:bg-surface"
                              aria-label={`Augmenter la quantité de ${item.nom}`}
                            >
                              +
                            </button>

                          </div>
                        </div>

                        {/* PRICE */}

                        <div className="text-right">

                          <p className="text-xs text-muted">
                            {formatCurrency(unitPrice)} ×{" "}
                            {item.quantite}
                          </p>

                          <p className="mt-1 text-lg font-bold text-text">
                            {formatCurrency(lineTotal)}
                          </p>

                        </div>

                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* SUMMARY */}

          <aside className="h-fit rounded-[24px] border border-border bg-surface-2 p-5 lg:sticky lg:top-6">

            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
              Résumé
            </p>

            <h2 className="mt-2 text-xl font-bold text-text">
              Total de la commande
            </h2>

            <div className="my-5 border-t border-border" />

            <div className="mt-5 rounded-[22px] border border-border bg-surface-2 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">
                    Sous-total
                  </span>

                  <span className="text-sm font-semibold text-text">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">
                    Livraison
                  </span>

                  <span className="text-sm font-semibold text-text">
                    {formatCurrency(SHIPPING_FEE)}
                  </span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-text">
                      {formatCurrency(orderTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/commander"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg"
              >
                Commander
              </Link>

              <p className="mt-3 text-center text-xs text-muted">
                Frais de livraison fixes : 8 DT
              </p>
            </div>

          </aside>
        </div>
      </section>
    </main>
  );
}