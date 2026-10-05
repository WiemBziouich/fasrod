"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  fetchCommandeById,
  fetchMesCommandes,
  type CommandeDetailRead,
  type CommandeRead,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type OrderListItem = CommandeRead & {
  articles: number;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MesCommandesPage() {
  const router = useRouter();

  const {
    client,
    accessToken,
    isLoading: isAuthLoading,
  } = useAuth();

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!client) {
      router.replace("/connexion");
      return;
    }

    if (!accessToken) {
      setIsLoadingOrders(false);
      return;
    }

    let active = true;

    async function loadOrders() {
      setIsLoadingOrders(true);
      setError(null);

      try {
        const commandList = await fetchMesCommandes(accessToken);

        const commandDetails: CommandeDetailRead[] =
          await Promise.all(
            commandList.map((order) =>
              fetchCommandeById(order.id, accessToken),
            ),
          );

        if (!active) {
          return;
        }

        setOrders(
          commandList.map((order, index) => ({
            ...order,
            articles: commandDetails[index].lignes.reduce(
              (sum, ligne) => sum + ligne.quantite,
              0,
            ),
          })),
        );
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger l'historique",
          );
        }
      } finally {
        if (active) {
          setIsLoadingOrders(false);
        }
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, [accessToken, client, isAuthLoading, router]);

  const ordersCount = useMemo(
    () => orders.length,
    [orders],
  );

  /* ---------------- AUTH LOADING ---------------- */

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
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 pb-24 pt-4 sm:px-6 md:pb-10 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4 sm:p-5">

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-border pb-4">

          <button
            type="button"
            onClick={() => router.push("/profil")}
            aria-label="Retour"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-lg text-text transition hover:bg-border"
          >
            ←
          </button>

          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted">
              Mes commandes
            </p>

            <h1 className="mt-1 text-2xl font-bold leading-tight text-text sm:text-3xl">
              Historique client
            </h1>

            {!isLoadingOrders && !error ? (
              <p className="mt-1 text-sm text-muted">
                {ordersCount} commande
                {ordersCount > 1 ? "s" : ""} enregistrée
                {ordersCount > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>

        </div>

        {/* ERROR */}
        {error ? (
          <div className="mt-5 rounded-[22px] border border-border bg-surface-2 px-4 py-4">
            <p className="text-sm font-semibold text-text">
              Impossible de charger tes commandes
            </p>

            <p className="mt-1 text-sm text-muted">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full border border-border bg-text px-4 py-2.5 text-xs font-semibold text-bg transition hover:opacity-90"
            >
              Réessayer
            </button>
          </div>
        ) : null}

        {/* LOADING */}
        {isLoadingOrders ? (
          <div className="mt-5 space-y-3">

            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-[126px] animate-pulse rounded-[22px] border border-border bg-surface-2"
              />
            ))}

          </div>
        ) : null}

        {/* ORDERS */}
        {!isLoadingOrders && !error ? (
          orders.length > 0 ? (
            <div className="mt-5 space-y-3">

              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/mes-commandes/${order.id}`}
                  className="group block"
                >
                  <article className="rounded-[22px] border border-border bg-surface-2 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-text/30 hover:bg-surface sm:p-5">

                    {/* TOP */}
                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                          Commande
                        </p>

                        <h2 className="mt-1 truncate text-lg font-bold text-text sm:text-xl">
                          {order.id.slice(0, 8)}
                        </h2>

                      </div>

                      {/* STATUS */}
                      <span className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-text">
                        {order.statut}
                      </span>

                    </div>

                    {/* BOTTOM */}
                    <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-3">

                      <div className="flex flex-wrap gap-x-5 gap-y-1">

                        <div>
                          <p className="text-[9px] uppercase tracking-[0.18em] text-muted">
                            Date
                          </p>

                          <p className="mt-1 text-sm font-medium text-text">
                            {formatDate(order.cree_le)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] uppercase tracking-[0.18em] text-muted">
                            Articles
                          </p>

                          <p className="mt-1 text-sm font-medium text-text">
                            {order.articles}
                          </p>
                        </div>

                      </div>

                      {/* ARROW */}
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-base text-text transition-transform duration-200 group-hover:translate-x-0.5"
                      >
                        →
                      </span>

                    </div>

                  </article>
                </Link>
              ))}

            </div>
          ) : (
            /* EMPTY STATE */
            <div className="mt-5 rounded-[22px] border border-border bg-surface-2 px-6 py-14 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border text-lg text-muted">
                ×
              </div>

              <h2 className="mt-4 text-lg font-bold text-text">
                Aucune commande
              </h2>

              <p className="mx-auto mt-1 max-w-[360px] text-sm text-muted">
                Tu n&apos;as encore passé aucune commande.
                Tes achats apparaîtront ici.
              </p>

              <Link
                href="/catalogue"
                className="mt-5 inline-flex rounded-full bg-text px-5 py-2.5 text-xs font-semibold text-bg transition hover:opacity-90"
              >
                Explorer le catalogue
              </Link>

            </div>
          )
        ) : null}

      </section>
    </main>
  );
}