import Link from "next/link";

import type { ProduitImageRead, ProduitRead } from "@/lib/api";
import type { CatalogueProduct } from "@/lib/catalogue";
import {
  formatPrice,
  getProductColors,
  getProductImage,
  getProductPrice,
} from "@/lib/catalogue";

type CatalogueProductCardProps = {
  product: CatalogueProduct | ProduitRead;
  image?: ProduitImageRead;
  productId?: string;
  categoryLabel?: string;
};

function isApiProduct(
  product: CatalogueProduct | ProduitRead,
): product is ProduitRead {
  return "id" in product && "images" in product && "variantes" in product;
}

export function CatalogueProductCard({
  product,
  image,
  productId,
  categoryLabel,
}: CatalogueProductCardProps) {
  const apiProduct = isApiProduct(product) ? product : undefined;

  const productName = apiProduct ? apiProduct.nom : product.name;

  const productPrice = apiProduct
    ? getProductPrice(apiProduct)
    : product.price;

  const productColors = apiProduct
    ? getProductColors(apiProduct)
    : product.colors;

  const productImage = apiProduct
    ? getProductImage(apiProduct)
    : image;

  const badge = categoryLabel
    ? categoryLabel
    : !apiProduct
      ? product.kind === "baggy"
        ? "Baggy"
        : product.kind === "tshirt"
          ? "T-shirt"
          : "Set"
      : "Produit";

  const card = (
    <article className="group overflow-hidden rounded-[22px] border border-border bg-surface-2 transition duration-200 hover:-translate-y-0.5 hover:border-text/30">
      {/* IMAGE */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        {productImage ? (
          <img
            src={productImage.url}
            alt={productImage.alt_text ?? productName}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-full border border-border px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted">
              Image à venir
            </div>
          </div>
        )}

        {/* CATEGORY */}
        <span className="absolute left-3 top-3 rounded-full border border-border bg-surface/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-text backdrop-blur">
          {badge}
        </span>
      </div>

      {/* INFO */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-sm font-bold leading-tight text-text">
            {productName}
          </h2>

          <p className="shrink-0 text-sm font-semibold text-text">
            {formatPrice(productPrice)}
          </p>
        </div>

        {productColors.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {productColors.map((color) => (
              <span
                key={color}
                className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted"
              >
                {color}
              </span>
            ))}
          </div>
        ) : null}
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