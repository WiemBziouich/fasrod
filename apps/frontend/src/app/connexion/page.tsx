"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ConnexionPage() {
  const router = useRouter();
  const { client, isLoading, setSession } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && client) {
      router.replace("/profil");
    }
  }, [client, isLoading, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await login({ identifier, password });
      setSession(session);
      router.replace("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Connexion impossible");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || client) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full rounded-[28px] border border-border bg-surface p-6 text-center text-muted">
          Vérification de la session...
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="w-full rounded-[28px] border border-border bg-surface p-6">
        <div className="border-b border-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Connexion</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text">Accède à ton compte</h1>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Email ou téléphone</span>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              required
            />
          </label>

          {error ? <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text">{error}</div> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg disabled:opacity-50"
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted">
          Pas encore de compte ? <Link href="/inscription" className="text-text underline">Créer un compte</Link>
        </p>
      </section>
    </main>
  );
}