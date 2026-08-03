"use client";

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

  if (isLoading || !client) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Vérification de la session...
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-border bg-surface p-4">
        <div className="border-b border-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Profil</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text">Compte connecté</h1>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Nom</p>
            <p className="mt-2 text-lg font-semibold text-text">{client.nom}</p>
          </div>

          <div className="rounded-[22px] border border-border bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Téléphone</p>
            <p className="mt-2 text-lg font-semibold text-text">{client.telephone}</p>
          </div>

          <div className="rounded-[22px] border border-border bg-surface-2 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Email</p>
            <p className="mt-2 text-lg font-semibold text-text">{client.email}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {client.is_admin ? "Compte administrateur" : "Compte client"}
          </p>

          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/connexion");
            }}
            className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg"
          >
            Déconnexion
          </button>
        </div>
      </section>
    </main>
  );
}