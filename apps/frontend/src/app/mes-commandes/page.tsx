"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchCommandeById, fetchMesCommandes, type CommandeDetailRead, type CommandeRead } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type OrderListItem = CommandeRead & { articles: number };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MesCommandesPage() {
  const router = useRouter();
  const { client, accessToken, isLoading } = useAuth();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
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

    async function loadOrders() {
      try {
        const commandList = await fetchMesCommandes(accessToken);
        const commandDetails: CommandeDetailRead[] = await Promise.all(
          commandList.map((order) => fetchCommandeById(order.id, accessToken)),
        );

        if (!active) {
          return;
        }

        setOrders(
          commandList.map((order, index) => ({
            ...order,
            articles: commandDetails[index].lignes.reduce((sum, ligne) => sum + ligne.quantite, 0),
          })),
        );
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Impossible de charger l'historique");
        }
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, [accessToken, client, isLoading, router]);

  const ordersCount = useMemo(() => orders.length, [orders]);

  if (isLoading || !client) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Vérification de la session...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="border-b border-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Mes commandes</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text">Historique client</h1>
          <p className="mt-2 text-sm text-muted">{ordersCount} commande(s) enregistrée(s).</p>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text">{error}</div> : null}

        <div className="mt-4 space-y-3">
          {orders.length > 0 ? (
            orders.map((order) => (
              <Link key={order.id} href={`/mes-commandes/${order.id}`} className="block">
                <article className="rounded-[22px] border border-border bg-surface-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-text">Commande {order.id.slice(0, 8)}</h2>
                      <p className="mt-1 text-sm text-muted">{formatDate(order.cree_le)}</p>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.24em] text-text">
                      {order.statut}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{order.articles} article(s)</p>
                </article>
              </Link>
            ))
          ) : (
            <div className="rounded-[22px] border border-border bg-surface-2 p-5 text-sm text-muted">
              Tu n'as encore passé aucune commande.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}