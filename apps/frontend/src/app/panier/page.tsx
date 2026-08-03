"use client";

import Link from "next/link";

import { useCart } from "@/lib/cart-context";

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} DT`;
}

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full rounded-[28px] border border-border bg-surface p-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Panier vide</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-text">Aucun article pour le moment.</h1>
          <p className="mt-3 text-sm text-muted">Ajoute un t-shirt, un hoodie, un short ou un jean depuis la fiche produit.</p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg"
          >
            Continuer shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Panier</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-text">Tes articles</h1>
          </div>
          <Link href="/" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text">
            Retour au feed
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.varianteId} className="rounded-[22px] border border-border bg-surface-2 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-text">{item.nom}</h2>
                  <p className="mt-1 text-sm text-muted">
                    Taille {item.taille} · Couleur {item.couleur}
                  </p>
                  <p className="mt-2 text-sm text-text">{item.prix}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.varianteId)}
                  className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-text"
                >
                  Supprimer
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.varianteId, item.quantite - 1)}
                    className="rounded-full border border-border px-3 py-2 text-sm text-text"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold text-text">{item.quantite}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.varianteId, item.quantite + 1)}
                    className="rounded-full border border-border px-3 py-2 text-sm text-text"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-muted">{formatCurrency(Number(item.prix) * item.quantite)}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[22px] border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Total</span>
            <span className="text-2xl font-bold text-text">{formatCurrency(total)}</span>
          </div>
          <Link
            href="/commander"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg"
          >
            Commander
          </Link>
        </div>
      </section>
    </main>
  );
}