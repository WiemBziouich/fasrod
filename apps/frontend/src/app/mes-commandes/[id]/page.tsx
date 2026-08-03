"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchCommandeById, type CommandeDetailRead } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MesCommandeDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter();
  const { client, accessToken, isLoading } = useAuth();
  const [order, setOrder] = useState<CommandeDetailRead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!client) {
      router.replace("/connexion");
      return;
    }

    if (!accessToken) {
      return;
    }

    let active = true;

    async function loadOrder() {
      const { id } = await params;

      try {
        const detail = await fetchCommandeById(id, accessToken);
        if (active) {
          setOrder(detail);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Commande introuvable");
        }
      }
    }

    void loadOrder();

    return () => {
      active = false;
    };
  }, [accessToken, client, isLoading, params, router]);

  if (isLoading || !client) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Vérification de la session...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-text">
          {error}
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Chargement de la commande...
        </div>
      </main>
    );
  }

  const totalItems = order.lignes.reduce((sum, ligne) => sum + ligne.quantite, 0);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Commande</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-text">{order.id}</h1>
          </div>
          <Link href="/mes-commandes" className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text">
            Retour
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Statut</p>
            <p className="mt-2 text-xl font-semibold text-text">{order.statut}</p>
            <p className="mt-3 text-sm text-muted">{formatDate(order.cree_le)}</p>
          </div>
          <div className="rounded-[22px] border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Livraison</p>
            <p className="mt-2 text-sm text-text">{order.gouvernorat}</p>
            <p className="mt-1 text-sm text-text">{order.ville}</p>
            <p className="mt-1 text-sm text-text">{order.adresse}</p>
          </div>
        </div>

        {order.commentaire ? (
          <div className="mt-4 rounded-[22px] border border-border bg-surface-2 p-4 text-sm text-text">
            {order.commentaire}
          </div>
        ) : null}

        <div className="mt-4 rounded-[22px] border border-border bg-surface-2 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Lignes</p>
          <div className="mt-3 space-y-3">
            {order.lignes.map((ligne) => (
              <div key={ligne.id} className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-text">Variante {ligne.variante_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted">Quantité {ligne.quantite}</p>
                </div>
                <span className="text-sm text-text">{ligne.prix_unitaire}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">{totalItems} article(s)</p>
        </div>
      </section>
    </main>
  );
}