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

export function ProductDetailView({
  product,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem } = useCart();

  /* -------------------------------------------------------------------------- */
  /*                                  VARIANTS                                  */
  /* -------------------------------------------------------------------------- */

  const colors = useMemo(
    () =>
      Array.from(
        new Set(
          product.variantes.map(
            (variant) => variant.couleur,
          ),
        ),
      ),
    [product.variantes],
  );

  const sizes = useMemo(
    () =>
      sortSizes(
        Array.from(
          new Set(
            product.variantes.map(
              (variant) => variant.taille,
            ),
          ),
        ),
      ),
    [product.variantes],
  );

  const isSizeInStock = (
    color: string,
    size: string,
  ) =>
    product.variantes.some(
      (variant) =>
        variant.couleur === color &&
        variant.taille === size &&
        variant.quantite_disponible > 0,
    );

  const pickSize = (
    color: string,
    preferred?: string,
  ) => {
    if (
      preferred &&
      isSizeInStock(color, preferred)
    ) {
      return preferred;
    }

    return (
      sizes.find((size) =>
        isSizeInStock(color, size),
      ) ??
      preferred ??
      sizes[0] ??
      ""
    );
  };

  const [selectedColor, setSelectedColor] =
    useState(colors[0] ?? "");

  const [selectedSize, setSelectedSize] =
    useState(() =>
      pickSize(colors[0] ?? ""),
    );

  const [activeImageId, setActiveImageId] =
    useState<string | null>(null);

  const [justAdded, setJustAdded] =
    useState(false);

  /* -------------------------------------------------------------------------- */
  /*                                   IMAGES                                   */
  /* -------------------------------------------------------------------------- */

  const images = useMemo(() => {
    if (
      !product.images ||
      product.images.length === 0
    ) {
      return [];
    }

    return [...product.images].sort((a, b) => {
      if (
        a.est_principale &&
        !b.est_principale
      ) {
        return -1;
      }

      if (
        !a.est_principale &&
        b.est_principale
      ) {
        return 1;
      }

      return (
        (a.ordre ?? 0) -
        (b.ordre ?? 0)
      );
    });
  }, [product.images]);

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

  const productWideImages = useMemo(
    () =>
      images.filter(
        (image) =>
          !image.couleur &&
          !image.variante_id,
      ),
    [images],
  );

  const automaticImage = useMemo(
    () =>
      selectedColorImages[0] ??
      productWideImages.find(
        (image) => image.est_principale,
      ) ??
      productWideImages[0] ??
      images.find(
        (image) => image.est_principale,
      ) ??
      images[0] ??
      null,
    [
      selectedColorImages,
      productWideImages,
      images,
    ],
  );

  const activeImage =
    images.find(
      (image) => image.id === activeImageId,
    ) ?? automaticImage;

  /* -------------------------------------------------------------------------- */
  /*                              SELECTED VARIANT                              */
  /* -------------------------------------------------------------------------- */

  const selectedVariant =
    product.variantes.find(
      (variant) =>
        variant.couleur === selectedColor &&
        variant.taille === selectedSize,
    );

  const stock =
    selectedVariant?.quantite_disponible ?? 0;

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
      ? Math.round(
          (1 - price / oldPrice) * 100,
        )
      : null;

  const collectionBadge =
    product.collections[0]?.nom;

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

  const handleColorChange = (
    color: string,
  ) => {
    setSelectedColor(color);

    setSelectedSize((current) =>
      pickSize(color, current),
    );

    setActiveImageId(null);
  };

  const handleImageClick = (
    imageId: string,
  ) => {
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
      image: activeImage?.url,
    });

    setJustAdded(true);
  };

  /* -------------------------------------------------------------------------- */
  /*                                    VIEW                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-4 pb-28 pt-4 sm:px-6 lg:px-8">

      {/* -------------------------------------------------------------------- */}
      {/* TOP BAR                                                              */}
      {/* -------------------------------------------------------------------- */}

      <div className="flex items-center justify-between gap-4">

        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-text transition hover:border-text hover:bg-surface-2"
        >
          <span
            aria-hidden
            className="text-base leading-none"
          >
            ←
          </span>

          Retour
        </button>

        <span className="hidden text-[10px] uppercase tracking-[0.32em] text-muted sm:block">
          Détail du produit
        </span>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* PRODUCT                                                              */}
      {/* -------------------------------------------------------------------- */}

      <section className="mt-5 grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10">

        {/* ------------------------------------------------------------------ */}
        {/* GALLERY                                                            */}
        {/* ------------------------------------------------------------------ */}

        <div className="flex flex-col gap-3 lg:flex-row-reverse">

          {/* MAIN IMAGE */}

          <div className="relative min-w-0 flex-1 overflow-hidden rounded-[24px] border border-border bg-surface">

            {activeImage ? (
              <div className="flex max-h-[680px] min-h-[420px] items-center justify-center bg-surface sm:min-h-[520px] lg:max-h-[620px]">

                <img
                  src={activeImage.url}
                  alt={
                    activeImage.alt_text ??
                    `${product.nom} ${selectedColor}`
                  }
                  className="h-full max-h-[620px] w-full object-contain"
                />

              </div>
            ) : (
              <div className="flex aspect-[4/5] min-h-[420px] w-full items-center justify-center text-[10px] uppercase tracking-[0.3em] text-muted">
                Image à venir
              </div>
            )}

            {collectionBadge ? (
              <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                {collectionBadge}
              </span>
            ) : null}

          </div>

          {/* THUMBNAILS */}

          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:max-h-[620px] lg:w-[76px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0">

              {images.map(
                (image, index) => {
                  const isActive =
                    image.id ===
                    activeImage?.id;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() =>
                        handleImageClick(
                          image.id,
                        )
                      }
                      aria-label={`Voir l'image ${index + 1}`}
                      aria-current={
                        isActive
                      }
                      className={`h-[72px] w-[58px] shrink-0 overflow-hidden rounded-[14px] border bg-surface transition sm:h-[82px] sm:w-[66px] lg:h-[86px] lg:w-[70px] ${
                        isActive
                          ? "border-text opacity-100"
                          : "border-border opacity-55 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                },
              )}

            </div>
          ) : null}

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PRODUCT INFO                                                       */}
        {/* ------------------------------------------------------------------ */}

        <div className="space-y-5 lg:sticky lg:top-6">

          {/* TITLE */}

          <div>

            <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
              {product.categorie.nom}
              {collectionBadge
                ? ` · ${collectionBadge}`
                : ""}
            </p>

            <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] text-text sm:text-4xl">
              {product.nom}
            </h1>

          </div>

          {/* PRICE */}

          <div className="flex flex-wrap items-end gap-3">

            <span className="font-display text-3xl font-bold text-text">
              {formatPrice(price)}
            </span>

            {oldPrice &&
            oldPrice > price ? (
              <span className="pb-1 text-sm text-muted line-through">
                {formatPrice(oldPrice)}
              </span>
            ) : null}

            {discount ? (
              <span className="mb-1 rounded-full bg-text px-2.5 py-1 text-[10px] font-bold text-bg">
                -{discount}%
              </span>
            ) : null}

          </div>

          {/* PROMOTIONS */}

          {product.promotions.length >
          0 ? (
            <div className="space-y-2">

              {product.promotions.map(
                (promotion) => (
                  <div
                    key={promotion.id}
                    className="rounded-2xl border border-border bg-surface px-4 py-3 text-xs"
                  >
                    <span className="font-semibold text-text">
                      {promotion.type}{" "}
                      {promotion.valeur}
                    </span>

                    {promotion.description ? (
                      <span className="text-muted">
                        {" "}
                        ·{" "}
                        {promotion.description}
                      </span>
                    ) : null}
                  </div>
                ),
              )}

            </div>
          ) : null}

          {/* DESCRIPTION */}

          {product.description ? (
            <p className="max-w-[52ch] text-[13px] leading-5 text-muted">
              {product.description}
            </p>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* COLORS                                                            */}
          {/* ---------------------------------------------------------------- */}

          {colors.length > 0 ? (
            <div>

              <div className="flex items-center justify-between">

                <p className="text-xs font-semibold text-text">
                  Couleur
                </p>

                <span className="text-xs text-muted">
                  {selectedColor}
                </span>

              </div>

              <div className="mt-3 flex flex-wrap gap-3">

                {colors.map(
                  (color) => {
                    const isActive =
                      color ===
                      selectedColor;

                    const hasImage =
                      images.some(
                        (image) =>
                          image.couleur ===
                            color &&
                          !image.variante_id,
                      );

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          handleColorChange(
                            color,
                          )
                        }
                        aria-label={color}
                        aria-pressed={
                          isActive
                        }
                        title={
                          hasImage
                            ? color
                            : `${color} — image non disponible`
                        }
                        style={{
                          backgroundColor:
                            getColorHex(
                              color,
                            ),
                        }}
                        className={`h-9 w-9 rounded-full border border-white/20 transition ${
                          isActive
                            ? "ring-2 ring-text ring-offset-2 ring-offset-bg"
                            : "hover:scale-105"
                        }`}
                      />
                    );
                  },
                )}

              </div>

            </div>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* SIZES                                                             */}
          {/* ---------------------------------------------------------------- */}

          {sizes.length > 0 ? (
            <div>

              <div className="flex items-center justify-between">

                <p className="text-xs font-semibold text-text">
                  Taille
                </p>

                <span className="text-xs text-muted">
                  {selectedSize}
                </span>

              </div>

              <div className="mt-3 flex flex-wrap gap-2">

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
                        setSelectedSize(
                          size,
                        )
                      }
                      aria-pressed={
                        isActive
                      }
                      className={`min-w-[48px] rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                        isActive
                          ? "border-text bg-text text-bg"
                          : available
                            ? "border-border bg-surface text-text hover:border-text"
                            : "cursor-not-allowed border-border text-muted line-through opacity-40"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}

              </div>

              {!isOutOfStock &&
              stock <=
                LOW_STOCK_THRESHOLD ? (
                <p className="mt-3 text-xs font-semibold text-text">
                  Plus que {stock} en stock
                </p>
              ) : null}

            </div>
          ) : null}

          {/* ---------------------------------------------------------------- */}
          {/* CTA                                                               */}
          {/* ---------------------------------------------------------------- */}

          <div className="flex gap-2.5 pt-1">

            <button
              type="button"
              disabled={
                isOutOfStock ||
                !selectedVariant
              }
              onClick={
                handleAddToCart
              }
              className="h-12 flex-1 rounded-full bg-text px-6 text-sm font-bold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isOutOfStock ||
              !selectedVariant
                ? "Rupture de stock"
                : justAdded
                  ? "Ajouté ✓"
                  : "Ajouter au panier"}
            </button>

            <FavoriteToggleButton
              productId={product.id}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-base text-text transition hover:border-text hover:bg-surface-2"
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
          {/* INFO                                                              */}
          {/* ---------------------------------------------------------------- */}

          <ul className="grid grid-cols-3 overflow-hidden rounded-[20px] border border-border bg-surface">

            {INFO_ITEMS.map(
              (item) => (
                <li
                  key={item.title}
                  className="min-w-0 border-r border-border p-3.5 last:border-r-0 sm:p-4"
                >

                  <InfoIcon
                    name={item.icon}
                  />

                  <p className="mt-2 text-[11px] font-semibold text-text">
                    {item.title}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-muted">
                    {item.text}
                  </p>

                </li>
              ),
            )}

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

        <circle
          cx="7"
          cy="17.5"
          r="1.7"
        />

        <circle
          cx="17"
          cy="17.5"
          r="1.7"
        />
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