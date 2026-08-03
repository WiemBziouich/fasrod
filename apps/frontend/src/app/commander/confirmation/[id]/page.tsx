import Link from "next/link";

type ConfirmationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CommandeConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="w-full rounded-[28px] border border-border bg-surface p-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.32em] text-muted">Commande confirmée</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-text">Ta commande a bien été enregistrée.</h1>
        <p className="mt-3 text-sm text-muted">Numéro de commande : {id}</p>
        <Link
          href="/mes-commandes"
          className="mt-5 inline-flex rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg"
        >
          Voir mes commandes
        </Link>
      </section>
    </main>
  );
}