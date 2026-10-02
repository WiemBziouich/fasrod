"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProduitRead } from "@/lib/api";
import { formatPrice, getProductImage, getProductPrice } from "@/lib/catalogue";
import { useCart } from "@/lib/cart-context";

type ProductPurchaseBoxProps = {
  product: ProduitRead;
};

export function ProductPurchaseBox({ product }: ProductPurchaseBoxProps) {
  const { addItem } = useCart();
  const sizes = useMemo(() => Array.from(new Set(product.variantes.map((variant) => variant.taille))), [product.variantes]);
  const colors = useMemo(() => Array.from(new Set(product.variantes.map((variant) => variant.couleur))), [product.variantes]);
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");

  useEffect(() => {
    if (!selectedSize && sizes[0]) {
      setSelectedSize(sizes[0]);
    }
    if (!selectedColor && colors[0]) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor, selectedSize, sizes]);

  const selectedVariant = product.variantes.find(
    (variant) => variant.taille === selectedSize && variant.couleur === selectedColor,
  );
  const isOutOfStock = selectedVariant ? selectedVariant.quantite_disponible <= 0 : true;
  const selectedImage = getProductImage(product, selectedColor, selectedVariant?.id);

  return (
    <section className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.32em] text-sand">Choisir la variante</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-text">Taille et couleur</h2>
      </div>

      {selectedImage ? (
        <img
          src={selectedImage.url}
          alt={selectedImage.alt_text ?? `${product.nom} ${selectedColor}`}
          className="aspect-[4/5] w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
          Aucune image disponible pour cette couleur.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-muted">Taille</span>
          <select
            value={selectedSize}
            onChange={(event) => setSelectedSize(event.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none"
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.24em] text-muted">Couleur</span>
          <select
            value={selectedColor}
            onChange={(event) => setSelectedColor(event.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none"
          >
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedVariant ? (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text">
          <span>{selectedVariant.quantite_disponible > 0 ? `${selectedVariant.quantite_disponible} en stock` : "Rupture de stock"}</span>
          <span>{selectedVariant.taille} · {selectedVariant.couleur}</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
          Aucune variante correspondante pour cette combinaison.
        </div>
      )}

      <button
        type="button"
        disabled={isOutOfStock || !selectedVariant}
        onClick={() => {
          if (!selectedVariant) {
            return;
          }

          addItem({
            varianteId: selectedVariant.id,
            produitId: product.id,
            nom: product.nom,
            taille: selectedVariant.taille,
            couleur: selectedVariant.couleur,
            prix: formatPrice(getProductPrice(product)),
          });
        }}
        className="w-full rounded-full border border-border bg-text px-4 py-3 text-sm font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
      </button>
    </section>
  );
}