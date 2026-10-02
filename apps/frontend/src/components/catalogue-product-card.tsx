import Link from "next/link";

import type { ProduitImageRead } from "@/lib/api";
import type { CatalogueProduct } from "@/lib/catalogue";
import { formatPrice } from "@/lib/catalogue";

export function CatalogueProductCard({
  product,
  image,
  productId,
}: {
  product: CatalogueProduct;
  image?: ProduitImageRead;
  productId?: string;
}) {
  const card = (
    <article className="overflow-hidden rounded-[22px] border border-border bg-surface-2 p-3">
      <div className="flex aspect-[4/4.5] flex-col justify-between rounded-[18px] border border-border bg-surface p-3">
        {image ? (
          <img
            src={image.url}
            alt={image.alt_text ?? product.name}
            className="mb-3 aspect-[4/4.5] w-full rounded-lg object-cover"
          />
        ) : null}

        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-text">
            {product.kind === "baggy"
              ? "Baggy"
              : product.kind === "tshirt"
                ? "T-shirt"
                : "Set"}
          </span>

          {!image ? (
            <span className="text-[10px] text-muted">Image à fournir</span>
          ) : null}
        </div>

        <div>
          <h2 className="text-xl font-bold leading-tight text-text">
            {product.name}
          </h2>

          <p className="mt-1 text-base font-semibold text-text">
            {formatPrice(product.price)}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.colors.map((color) => (
              <span
                key={color}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );

  return productId ? (
    <Link href={`/produits/${productId}`} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}

