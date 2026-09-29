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

  return (
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-lg text-text transition hover:bg-border"
          >
            ←
          </button>

          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-muted">
              Profil
            </p>

            <h1 className="mt-1 text-2xl font-bold leading-tight text-text">
              Mon compte
            </h1>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Nom
            </p>

            <p className="mt-2 text-lg font-semibold text-text">
              {client.nom}
            </p>
          </div>

          <div className="rounded-[22px] border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Téléphone
            </p>

            <p className="mt-2 text-lg font-semibold text-text">
              {client.telephone}
            </p>
          </div>

          <div className="rounded-[22px] border border-border bg-surface-2 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Email
            </p>

            <p className="mt-2 break-all text-lg font-semibold text-text">
              {client.email}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-border bg-surface-2 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            Type de compte
          </p>

          <p className="mt-2 text-sm font-semibold text-text">
            {client.is_admin ? "Compte administrateur" : "Compte client"}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/mes-commandes"
            className="rounded-full border border-border bg-surface-2 px-4 py-3 text-center text-sm font-semibold text-text transition hover:bg-border"
          >
            Mes commandes
          </Link>

          <Link
            href="/favoris"
            className="rounded-full border border-border bg-surface-2 px-4 py-3 text-center text-sm font-semibold text-text transition hover:bg-border"
          >
            Mes favoris
          </Link>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Déconnexion
        </button>
      </section>
    </main>
  );
}

