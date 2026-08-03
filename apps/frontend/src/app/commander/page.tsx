"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, createCommande } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

type FormState = {
  gouvernorat: string;
  ville: string;
  adresse: string;
  commentaire: string;
};

export default function CommanderPage() {
  const router = useRouter();
  const { client, accessToken, isLoading } = useAuth();
  const { items, clearCart } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    gouvernorat: "",
    ville: "",
    adresse: "",
    commentaire: "",
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!client) {
      router.replace("/connexion");
    }
  }, [client, isLoading, router]);

  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantite, 0), [items]);

  if (isLoading || !client) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Vérification de la session...
        </div>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      router.replace("/connexion");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const commande = await createCommande(
        {
          gouvernorat: form.gouvernorat,
          ville: form.ville,
          adresse: form.adresse,
          commentaire: form.commentaire || null,
          lignes: items.map((item) => ({ variante_id: item.varianteId, quantite: item.quantite })),
        },
        accessToken,
      );

      clearCart();
      router.replace(`/commander/confirmation/${commande.id}`);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 409) {
        setError("Une des tailles n'est plus disponible, retourne au panier pour ajuster.");
      } else if (submitError instanceof ApiError) {
        setError(submitError.detail);
      } else {
        setError("Impossible de finaliser la commande.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="border-b border-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Commander</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text">Finalise ta commande</h1>
          <p className="mt-2 text-sm text-muted">{totalQuantity} article(s) dans le panier.</p>
        </div>

        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-muted">Gouvernorat</span>
              <input
                value={form.gouvernorat}
                onChange={(event) => setForm({ ...form, gouvernorat: event.target.value })}
                className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-muted">Ville</span>
              <input
                value={form.ville}
                onChange={(event) => setForm({ ...form, ville: event.target.value })}
                className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
                required
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Adresse</span>
            <textarea
              value={form.adresse}
              onChange={(event) => setForm({ ...form, adresse: event.target.value })}
              className="min-h-28 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Commentaire</span>
            <textarea
              value={form.commentaire}
              onChange={(event) => setForm({ ...form, commentaire: event.target.value })}
              className="min-h-24 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Envoi..." : "Valider la commande"}
          </button>
        </form>
      </section>
    </main>
  );
}