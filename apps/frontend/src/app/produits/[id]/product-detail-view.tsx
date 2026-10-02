"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import type { ProduitRead } from "@/lib/api";
import { formatPrice, getProductPrice, sortSizes } from "@/lib/catalogue";
import { useCart } from "@/lib/cart-context";
import { getColorHex } from "@/lib/colors";

type ProductDetailViewProps = {
  product: ProduitRead;
};

// TODO: remplacer par les vraies règles de livraison / retours de Fasrod.
const INFO_ITEMS = [
  { icon: "truck", title: "Livraison", text: "Partout en Tunisie" },
  { icon: "cash", title: "Paiement", text: "À la livraison" },
  { icon: "return", title: "Retours", text: "Selon conditions" },
] as const;

const LOW_STOCK_THRESHOLD = 5;

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem } = useCart();

  /* -------------------------------------------------------------------------- */
  /*                                  VARIANTS                                  */
  /* -------------------------------------------------------------------------- */

  const colors = useMemo(
    () => Array.from(new Set(product.variantes.map((variant) => variant.couleur))),
    [product.variantes],
  );

  const sizes = useMemo(
    () =>
      sortSizes(
        Array.from(
          new Set(product.variantes.map((variant) => variant.taille)),
        ),
      ),
    [product.variantes],
  );

  const isSizeInStock = (color: string, size: string) =>
    product.variantes.some(
      (variant) =>
        variant.couleur === color &&
        variant.taille === size &&
        variant.quantite_disponible > 0,
    );

  const pickSize = (color: string, preferred?: string) => {
    if (preferred && isSizeInStock(color, preferred)) {
      return preferred;
    }

    return (
      sizes.find((size) => isSizeInStock(color, size)) ??
      preferred ??
      sizes[0] ??
      ""
    );
  };

  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState(() =>
    pickSize(colors[0] ?? ""),
  );

  /*
   * null = no manual thumbnail selected.
   *
   * When null, the gallery chooses automatically:
   * color image -> main product image -> first image.
   */
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const [justAdded, setJustAdded] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                                   IMAGES                                   */
  /* -------------------------------------------------------------------------- */

  /*
   * Use the images returned by the API directly.
   *
   * We deliberately do NOT depend on getProductImage/getProductImages here.
   * This makes the detail page behavior predictable.
   */
  const images = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return [];
    }

    return [...product.images].sort((a, b) => {
      // Main image first.
      if (a.est_principale && !b.est_principale) {
        return -1;
      }

      if (!a.est_principale && b.est_principale) {
        return 1;
      }

      // Then by explicit order.
      return (a.ordre ?? 0) - (b.ordre ?? 0);
    });
  }, [product.images]);

  /*
   * Images belonging to the currently selected color.
   *
   * A color image has:
   *   produit_id = product
   *   variante_id = null
   *   couleur = selectedColor
   *
   * Product-wide image:
   *   couleur = null
   *   variante_id = null
   */
  const selectedColorImages = useMemo(() => {
    if (!selectedColor) {
      return [];
    }

    return images.filter(
      (image) =>
        image.couleur === selectedColor &&
        !image.variante_id,
    );
  }, [images, selectedColor]);

  /*
   * Product-wide images are valid fallback images for every color.
   */
  const productWideImages = useMemo(
    () =>
      images.filter(
        (image) =>
          !image.couleur &&
          !image.variante_id,
      ),
    [images],
  );

  /*
   * Main product image.
   *
   * Priority:
   * 1. selected color image
   * 2. product-wide main image
   * 3. product-wide first image
   * 4. first available image
   */
  const automaticImage = useMemo(() => {
    return (
      selectedColorImages[0] ??
      productWideImages.find((image) => image.est_principale) ??
      productWideImages[0] ??
      images.find((image) => image.est_principale) ??
      images[0] ??
      null
    );
  }, [
    selectedColorImages,
    productWideImages,
    images,
  ]);

  /*
   * If the user manually clicked a thumbnail, use it.
   * Otherwise use the automatic image.
   */
  const activeImage =
    images.find((image) => image.id === activeImageId) ??
    automaticImage;

  /* -------------------------------------------------------------------------- */
  /*                              SELECTED VARIANT                              */
  /* -------------------------------------------------------------------------- */

  const selectedVariant = product.variantes.find(
    (variant) =>
      variant.couleur === selectedColor &&
      variant.taille === selectedSize,
  );

  const stock = selectedVariant?.quantite_disponible ?? 0;
  const isOutOfStock = stock <= 0;

  /* -------------------------------------------------------------------------- */
  /*                                   EFFECTS                                  */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!justAdded) {
      return;
    }

    const timeout = setTimeout(() => {
      setJustAdded(false);
    }, 1800);

    return () => clearTimeout(timeout);
  }, [justAdded]);

  /*
   * If the product data changes, make sure the selected color still exists.
   */
  useEffect(() => {
    if (colors.length === 0) {
      setSelectedColor("");
      return;
    }

    if (!colors.includes(selectedColor)) {
      setSelectedColor(colors[0]);
      setSelectedSize(pickSize(colors[0]));
      setActiveImageId(null);
    }
  }, [colors, selectedColor]);

  /* -------------------------------------------------------------------------- */
  /*                                  PRICING                                   */
  /* -------------------------------------------------------------------------- */

  const price = getProductPrice(product);

  const oldPrice = product.prix_promo
    ? Number(product.prix)
    : null;

  const discount =
    oldPrice && oldPrice > price
      ? Math.round((1 - price / oldPrice) * 100)
      : null;

  const collectionBadge = product.collections[0]?.nom;

  /* -------------------------------------------------------------------------- */
  /*                                  ACTIONS                                   */
  /* -------------------------------------------------------------------------- */

  const handleBack = () => {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      router.back();
    } else {
      router.push("/catalogue");
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);

    setSelectedSize((current) =>
      pickSize(color, current),
    );

    /*
     * Clear manual thumbnail selection.
     *
     * This allows the new color image to become the main image.
     */
    setActiveImageId(null);
  };

  const handleImageClick = (imageId: string) => {
    setActiveImageId(imageId);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) {
      return;
    }

    addItem({
      varianteId: selectedVariant.id,
      produitId: product.id,
      nom: product.nom,
      taille: selectedVariant.taille,
      couleur: selectedVariant.couleur,
      prix: formatPrice(price),
    });

    setJustAdded(true);
  };

  /* -------------------------------------------------------------------------- */
  /*                                    VIEW                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-32 pt-4 sm:px-6 lg:px-8">

      {/* -------------------------------------------------------------------- */}
      {/* TOP BAR                                                              */}
      {/* -------------------------------------------------------------------- */}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface"
        >
          <span aria-hidden>←</span>
          Retour
        </button>

        <span className="text-xs uppercase tracking-[0.3em] text-muted">
          Détail du produit
        </span>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* PRODUCT                                                              */}
      {/* -------------------------------------------------------------------- */}

      <section className="mt-5 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-10">

        {/* ------------------------------------------------------------------ */}
        {/* GALLERY                                                            */}
        {/* ------------------------------------------------------------------ */}

        <div className="flex flex-col gap-3 lg:flex-row-reverse">

          {/* MAIN IMAGE */}

          <div className="relative w-full overflow-hidden rounded-2xl bg-surface">

            {activeImage ? (
              <img
                src={activeImage.url}
                alt={
                  activeImage.alt_text ??
                  `${product.nom} ${selectedColor}`
                }
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-muted">
                Image à venir
              </div>
            )}

            {collectionBadge ? (
              <span className="absolute left-3 top-3 rounded-full bg-bg/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-text backdrop-blur">
                {collectionBadge}
              </span>
            ) : null}
          </div>

          {/* THUMBNAILS */}

          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:max-h-[560px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">

              {images.map((image, index) => {
                const isActive =
                  image.id === activeImage?.id;

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() =>
                      handleImageClick(image.id)
                    }
                    aria-label={`Voir l'image ${index + 1}`}
                    aria-current={isActive}
                    className={`h-[4.5rem] w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      isActive
                        ? "border-text"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PRODUCT INFO                                                       */}
        {/* ------------------------------------------------------------------ */}

        <div className="space-y-5">

          {/* TITLE */}

          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
              {product.categorie.nom}
              {collectionBadge
                ? ` · ${collectionBadge}`
                : ""}
            </p>

            <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight sm:text-3xl">
              {product.nom}
            </h1>
          </div>

          {/* PRICE */}

          <div className="flex flex-wrap items-end gap-3">
            <span className="font-display text-3xl font-bold">
              {formatPrice(price)}
            </span>

            {oldPrice && oldPrice > price ? (
              <span className="pb-1 text-sm text-muted line-through">
                {formatPrice(oldPrice)}
              </span>
            ) : null}

            {discount ? (
              <span className="mb-1 rounded-full bg-text px-2.5 py-0.5 text-xs font-bold text-bg">
                -{discount}%
              </span>
            ) : null}
          </div>

          {/* PROMOTIONS */}

          {product.promotions.length > 0 ? (
            <div className="space-y-2">
              {product.promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text"
                >
                  <span className="font-semibold">
                    {promotion.type} {promotion.valeur}
                  </span>

                  {promotion.description ? (
                    <span className="text-muted">
                      {" "}
                      · {promotion.description}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* DESCRIPTION */}

          {product.description ? (
            <p className="text-[13px] leading-5 text-muted">
              {product.description}
            </p>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* COLORS                                                            */}
          {/* ---------------------------------------------------------------- */}

          {colors.length > 0 ? (
            <div>
              <p className="text-[13px] font-semibold">
                Couleur :{" "}
                <span className="font-normal text-muted">
                  {selectedColor}
                </span>
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {colors.map((color) => {
                  const isActive =
                    color === selectedColor;

                  /*
                   * Check whether this color actually has an image.
                   * This is only visual information; a color without
                   * an image is still selectable.
                   */
                  const hasImage = images.some(
                    (image) =>
                      image.couleur === color &&
                      !image.variante_id,
                  );

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        handleColorChange(color)
                      }
                      aria-label={color}
                      aria-pressed={isActive}
                      title={
                        hasImage
                          ? color
                          : `${color} — image non disponible`
                      }
                      style={{
                        backgroundColor:
                          getColorHex(color),
                      }}
                      className={`h-8 w-8 rounded-full border border-white/20 transition ${
                        isActive
                          ? "ring-2 ring-text ring-offset-2 ring-offset-bg"
                          : "hover:scale-105"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* SIZES                                                             */}
          {/* ---------------------------------------------------------------- */}

          {sizes.length > 0 ? (
            <div>
              <p className="text-[13px] font-semibold">
                Taille :{" "}
                <span className="font-normal text-muted">
                  {selectedSize}
                </span>
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const available =
                    isSizeInStock(
                      selectedColor,
                      size,
                    );

                  const isActive =
                    size === selectedSize;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!available}
                      onClick={() =>
                        setSelectedSize(size)
                      }
                      aria-pressed={isActive}
                      className={`min-w-[2.75rem] rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                        isActive
                          ? "border-text bg-text text-bg"
                          : available
                            ? "border-border text-text hover:border-text"
                            : "cursor-not-allowed border-border text-muted line-through opacity-40"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {!isOutOfStock &&
              stock <= LOW_STOCK_THRESHOLD ? (
                <p className="mt-3 text-sm font-semibold text-text">
                  Plus que {stock} en stock
                </p>
              ) : null}
            </div>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* CTA                                                               */}
          {/* ---------------------------------------------------------------- */}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={
                isOutOfStock || !selectedVariant
              }
              onClick={handleAddToCart}
              className="h-11 flex-1 rounded-full bg-text px-6 text-sm font-bold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isOutOfStock || !selectedVariant
                ? "Rupture de stock"
                : justAdded
                  ? "Ajouté ✓"
                  : "Ajouter au panier"}
            </button>

            <FavoriteToggleButton
              productId={product.id}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-base text-text transition hover:border-text"
            />
          </div>

          <p
            aria-live="polite"
            className="sr-only"
          >
            {justAdded
              ? "Produit ajouté au panier"
              : ""}
          </p>

          {/* ---------------------------------------------------------------- */}
          {/* INFO                                                               */}
          {/* ---------------------------------------------------------------- */}

          <ul className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface p-3.5">
            {INFO_ITEMS.map((item) => (
              <li
                key={item.title}
                className="flex flex-col items-start gap-1.5 text-xs"
              >
                <InfoIcon name={item.icon} />

                <span className="font-semibold text-text">
                  {item.title}
                </span>

                <span className="text-muted">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  ICONS                                     */
/* -------------------------------------------------------------------------- */

function InfoIcon({
  name,
}: {
  name: (typeof INFO_ITEMS)[number]["icon"];
}) {
  const common =
    "h-5 w-5 fill-none stroke-current stroke-[1.6] text-text";

  if (name === "truck") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={common}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 6h11v10H3zM14 9h4l3 3v4h-7"
        />

        <circle cx="7" cy="17.5" r="1.7" />
        <circle cx="17" cy="17.5" r="1.7" />
      </svg>
    );
  }

  if (name === "cash") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={common}
      >
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
        />

        <circle
          cx="12"
          cy="12"
          r="2.5"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={common}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"
      />
    </svg>
  );
}

