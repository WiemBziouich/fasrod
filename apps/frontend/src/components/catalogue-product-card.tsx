import Link from "next/link";

import type { ProduitImageRead } from "@/lib/api";
import type { CatalogueProduct } from "@/lib/catalogue";
import { formatPrice } from "@/lib/catalogue";

export function CatalogueProductCard({ product, image, productId }: { product: CatalogueProduct; image?: ProduitImageRead; productId?: string }) {
  const card = (
    <article className="overflow-hidden rounded-[30px] border border-border bg-surface-2 p-4">
      <div className="flex aspect-[4/5] flex-col justify-between rounded-[24px] border border-border bg-surface p-4">
        {image ? <img src={image.url} alt={image.alt_text ?? product.name} className="mb-3 aspect-[4/5] w-full rounded-xl object-cover" /> : null}
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-text">
            {product.kind === "baggy" ? "Baggy" : product.kind === "tshirt" ? "T-shirt" : "Set"}
          </span>
          {!image ? <span className="text-xs text-muted">Image à fournir</span> : null}
        </div>
        <div>
          <h2 className="text-2xl font-bold leading-tight text-text">{product.name}</h2>
          <p className="mt-2 text-lg font-semibold text-text">{formatPrice(product.price)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((color) => <span key={color} className="rounded-full border border-border px-2 py-1 text-xs text-muted">{color}</span>)}
          </div>
        </div>
      </div>
    </article>
  );

  return productId ? <Link href={`/produits/${productId}`} className="block">{card}</Link> : card;
}