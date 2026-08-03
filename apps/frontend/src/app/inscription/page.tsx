"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function InscriptionPage() {
  const router = useRouter();
  const { client, isLoading, setSession } = useAuth();
  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    telephone_secondaire: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isLoading && client) {
      router.replace("/profil");
    }
  }, [client, isLoading, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await register({
        nom: form.nom,
        telephone: form.telephone,
        telephone_secondaire: form.telephone_secondaire || null,
        email: form.email,
        password: form.password,
      });
      setSession(session);
      router.replace("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Inscription impossible");
    } finally {
      submittingRef.current = false;
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
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Inscription</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text">Créer un compte Fasrord</h1>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Nom</span>
            <input
              value={form.nom}
              onChange={(event) => setForm({ ...form, nom: event.target.value })}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-muted">Téléphone</span>
              <input
                value={form.telephone}
                onChange={(event) => setForm({ ...form, telephone: event.target.value })}
                className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-muted">Téléphone secondaire</span>
              <input
                value={form.telephone_secondaire}
                onChange={(event) => setForm({ ...form, telephone_secondaire: event.target.value })}
                className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Mot de passe</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
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
            {isSubmitting ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted">
          Déjà un compte ? <Link href="/connexion" className="text-text underline">Se connecter</Link>
        </p>
      </section>
    </main>
  );
}