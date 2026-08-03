import Link from "next/link";
import { notFound } from "next/navigation";

import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { fetchProductById } from "@/lib/api";
import { ProductPurchaseBox } from "./product-purchase-box";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  try {
    const product = await fetchProductById(id);

    return (
      <main className="mx-auto min-h-screen w-full max-w-[960px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-glow">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/90">
              Back
            </Link>
            <span className="text-xs uppercase tracking-[0.3em] text-sand">Product detail</span>
            <FavoriteToggleButton
              productId={product.id}
              className="rounded-full border border-border bg-surface-2 px-3 py-2 text-sm font-semibold text-text"
            />
          </div>

          <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-surface p-5">
              <div className="flex min-h-[420px] flex-col justify-between rounded-[24px] border border-white/15 bg-black/20 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
                    {product.collections[0]?.nom ?? "Featured"}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                    {product.variantes.length} variants
                  </span>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">Live catalog</p>
                  <h1 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-5xl">{product.nom}</h1>
                  <p className="mt-3 max-w-[36ch] text-sm leading-6 text-white/80">{product.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-white/10 bg-ink/90 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sand">Price</p>
                <div className="mt-2 flex items-end gap-3">
                  <span className="font-display text-4xl font-bold text-white">{product.prix_promo ?? product.prix}</span>
                  {product.prix_promo ? <span className="pb-1 text-sm text-white/50 line-through">{product.prix}</span> : null}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sand">Category</p>
                <p className="mt-2 text-lg font-semibold text-white">{product.categorie.nom}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sand">Collections</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.collections.map((collection) => (
                    <span key={collection.id} className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/80">
                      {collection.nom}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sand">Variants</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {product.variantes.map((variant) => (
                    <div key={variant.id} className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-sm font-semibold text-white">{variant.taille} · {variant.couleur}</p>
                      <p className="text-xs text-white/55">{variant.quantite_disponible} in stock</p>
                    </div>
                  ))}
                </div>
              </div>

              <ProductPurchaseBox product={product} />

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sand">Promotions</p>
                <div className="mt-2 space-y-2">
                  {product.promotions.length > 0 ? (
                    product.promotions.map((promotion) => (
                      <div key={promotion.id} className="rounded-[18px] border border-lime/20 bg-lime/10 px-4 py-3 text-sm text-white/90">
                        {promotion.type} {promotion.valeur}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                      No active promotion
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}