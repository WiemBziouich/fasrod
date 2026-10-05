"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";

export default function ProfilPage() {
  const router = useRouter();
  const { client, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !client) {
      router.replace("/connexion");
    }
  }, [client, isLoading, router]);

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Vérification de la session...
        </section>
      </main>
    );
  }

  if (!client) {
    return null;
  }

  async function handleLogout() {
    await logout();
    router.replace("/connexion");
  }

  const initials = client.nom
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 pb-24 pt-4 sm:px-6 md:pb-10 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4 sm:p-5">

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Retour"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-lg text-text transition hover:bg-border"
          >
            ←
          </button>

          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted">
              Profil
            </p>

            <h1 className="mt-1 text-2xl font-bold leading-tight text-text sm:text-3xl">
              Mon compte
            </h1>
          </div>
        </div>

        {/* IDENTITY */}
        <div className="mt-5 flex items-center gap-4 rounded-[24px] border border-border bg-surface-2 p-4 sm:p-5">
          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-text text-lg font-bold text-bg sm:h-16 sm:w-16 sm:text-xl"
          >
            {initials || "F"}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-text sm:text-2xl">
                {client.nom}
              </h2>

              {client.is_admin ? (
                <span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Admin
                </span>
              ) : null}
            </div>

            <p className="mt-1 truncate text-sm text-muted">
              {client.email}
            </p>
          </div>
        </div>

        {/* MAIN ACCOUNT ACTIONS */}
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted">
            Mon espace
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">

            {/* COMMANDES */}
            <Link
              href="/mes-commandes"
              className="group rounded-[22px] border border-border bg-surface-2 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-text/30 hover:bg-surface"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                    Commandes
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-text">
                    Mes commandes
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    Voir et suivre mes commandes
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-base text-text transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </div>
            </Link>

            {/* FAVORIS */}
            <Link
              href="/favoris"
              className="group rounded-[22px] border border-border bg-surface-2 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-text/30 hover:bg-surface"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                    Sauvegardés
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-text">
                    Mes favoris
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    Retrouver mes produits préférés
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-base text-text transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </div>
            </Link>

          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.32em] text-muted">
            Mes informations
          </p>

          <div className="mt-3 overflow-hidden rounded-[22px] border border-border bg-surface-2">

            {/* NAME + PHONE */}
            <div className="grid gap-1 border-b border-border p-4 sm:grid-cols-2 sm:gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                  Nom
                </p>

                <p className="mt-1 text-sm font-semibold text-text">
                  {client.nom}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                  Téléphone
                </p>

                <p className="mt-1 text-sm font-semibold text-text">
                  {client.telephone}
                </p>
              </div>
            </div>

            {/* EMAIL */}
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                Email
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-text">
                {client.email}
              </p>
            </div>

          </div>
        </div>

        {/* ACCOUNT STATUS */}
        <div className="mt-3 flex items-center justify-between gap-4 rounded-[22px] border border-border bg-surface-2 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              Compte
            </p>

            <p className="mt-1 text-sm font-semibold text-text">
              {client.is_admin ? "Administrateur" : "Client Fasrod"}
            </p>
          </div>

          <span className="rounded-full border border-border px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
            Actif
          </span>
        </div>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 w-full rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Déconnexion
        </button>

      </section>
    </main>
  );
}