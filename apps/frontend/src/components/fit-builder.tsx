"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProduitRead } from "@/lib/api";
import { catalogueProducts, formatPrice, getCatalogueProduct, getProductColors, getProductPrice } from "@/lib/catalogue";
import { useCart } from "@/lib/cart-context";

type FitBuilderProps = {
  products: ProduitRead[];
};

function isKind(product: ProduitRead, kind: "baggy" | "tshirt"): boolean {
  const catalogueProduct = getCatalogueProduct(product.nom);
  if (catalogueProduct) {
    return catalogueProduct.kind === kind;
  }

  const name = product.nom.toLowerCase();
  return kind === "baggy" ? name.includes("baggy") || name.includes("jogger") : name.includes("t-shirt");
}

export function FitBuilder({ products }: FitBuilderProps) {
  const { addItem } = useCart();
  const baggyProducts = useMemo(() => products.filter((product) => isKind(product, "baggy")), [products]);
  const tshirtProducts = useMemo(() => products.filter((product) => isKind(product, "tshirt")), [products]);
  const [baggyId, setBaggyId] = useState(baggyProducts[0]?.id ?? "");
  const [tshirtId, setTshirtId] = useState(tshirtProducts[0]?.id ?? "");
  const baggy = baggyProducts.find((product) => product.id === baggyId) ?? baggyProducts[0];
  const tshirt = tshirtProducts.find((product) => product.id === tshirtId) ?? tshirtProducts[0];
  const [baggyColor, setBaggyColor] = useState(getProductColors(baggy ?? { nom: "", variantes: [] })[0] ?? "");
  const [tshirtColor, setTshirtColor] = useState(getProductColors(tshirt ?? { nom: "", variantes: [] })[0] ?? "");

  useEffect(() => {
    if (!baggyId && baggyProducts[0]) {
      setBaggyId(baggyProducts[0].id);
      setBaggyColor(getProductColors(baggyProducts[0])[0] ?? "");
    }
    if (!tshirtId && tshirtProducts[0]) {
      setTshirtId(tshirtProducts[0].id);
      setTshirtColor(getProductColors(tshirtProducts[0])[0] ?? "");
    }
  }, [baggyId, baggyProducts, tshirtId, tshirtProducts]);

  const baggyVariant = baggy?.variantes.find((variant) => variant.couleur === baggyColor && variant.quantite_disponible > 0);
  const tshirtVariant = tshirt?.variantes.find((variant) => variant.couleur === tshirtColor && variant.quantite_disponible > 0);
  const combinedPrice = (baggy ? getProductPrice(baggy) : 0) + (tshirt ? getProductPrice(tshirt) : 0);

  if (!baggy || !tshirt) {
    return <CatalogueFitFallback />;
  }

  function addToCart(product: ProduitRead, variant: typeof baggyVariant) {
    if (!variant) {
      return;
    }

    addItem({
      varianteId: variant.id,
      produitId: product.id,
      nom: product.nom,
      taille: variant.taille,
      couleur: variant.couleur,
      prix: formatPrice(getProductPrice(product)),
    });
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
      <FitChoice
        label="1. Choisis ton baggy"
        products={baggyProducts}
        selectedProduct={baggy}
        selectedColor={baggyColor}
        onProductChange={(id) => {
          const nextProduct = baggyProducts.find((product) => product.id === id);
          setBaggyId(id);
          setBaggyColor(getProductColors(nextProduct ?? baggy)[0] ?? "");
        }}
        onColorChange={setBaggyColor}
      />
      <span className="pb-3 text-center font-display text-2xl text-sand">+</span>
      <FitChoice
        label="2. Choisis ton t-shirt"
        products={tshirtProducts}
        selectedProduct={tshirt}
        selectedColor={tshirtColor}
        onProductChange={(id) => {
          const nextProduct = tshirtProducts.find((product) => product.id === id);
          setTshirtId(id);
          setTshirtColor(getProductColors(nextProduct ?? tshirt)[0] ?? "");
        }}
        onColorChange={setTshirtColor}
      />
      <div className="lg:col-span-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-sm text-white/70">{baggy.nom} · {baggyColor} + {tshirt.nom} · {tshirtColor}</p>
          <p className="mt-1 text-lg font-semibold text-white">Total: {formatPrice(combinedPrice)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => addToCart(baggy, baggyVariant)} disabled={!baggyVariant} className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40">
            Ajouter le baggy
          </button>
          <button type="button" onClick={() => addToCart(tshirt, tshirtVariant)} disabled={!tshirtVariant} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            Ajouter le t-shirt
          </button>
        </div>
      </div>
    </div>
  );
}

function CatalogueFitFallback() {
  const baggyProducts = catalogueProducts.filter((product) => product.kind === "baggy");
  const tshirtProducts = catalogueProducts.filter((product) => product.kind === "tshirt");
  const [baggyName, setBaggyName] = useState(baggyProducts[0].name);
  const [tshirtName, setTshirtName] = useState(tshirtProducts[0].name);
  const baggy = baggyProducts.find((product) => product.name === baggyName) ?? baggyProducts[0];
  const tshirt = tshirtProducts.find((product) => product.name === tshirtName) ?? tshirtProducts[0];
  const [baggyColor, setBaggyColor] = useState(baggy.colors[0]);
  const [tshirtColor, setTshirtColor] = useState(tshirt.colors[0]);

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
      <CatalogueFitChoice
        label="1. Choisis ton baggy"
        products={baggyProducts}
        selectedName={baggy.name}
        selectedColor={baggyColor}
        onNameChange={(name) => {
          const next = baggyProducts.find((product) => product.name === name) ?? baggy;
          setBaggyName(next.name);
          setBaggyColor(next.colors[0]);
        }}
        onColorChange={setBaggyColor}
      />
      <span className="pb-3 text-center font-display text-2xl text-sand">+</span>
      <CatalogueFitChoice
        label="2. Choisis ton t-shirt"
        products={tshirtProducts}
        selectedName={tshirt.name}
        selectedColor={tshirtColor}
        onNameChange={(name) => {
          const next = tshirtProducts.find((product) => product.name === name) ?? tshirt;
          setTshirtName(next.name);
          setTshirtColor(next.colors[0]);
        }}
        onColorChange={setTshirtColor}
      />
      <div className="lg:col-span-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-sm text-white/70">{baggy.name} · {baggyColor} + {tshirt.name} · {tshirtColor}</p>
          <p className="mt-1 text-lg font-semibold text-white">Total: {formatPrice(baggy.price + tshirt.price)}</p>
        </div>
        <p className="text-xs text-white/50">Ajout au panier disponible dès que les variantes et le stock seront synchronisés.</p>
      </div>
    </div>
  );
}

function CatalogueFitChoice({
  label,
  products,
  selectedName,
  selectedColor,
  onNameChange,
  onColorChange,
}: {
  label: string;
  products: typeof catalogueProducts;
  selectedName: string;
  selectedColor: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
}) {
  const product = products.find((entry) => entry.name === selectedName) ?? products[0];

  return (
    <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-sand">{label}</p>
      <select value={product.name} onChange={(event) => onNameChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-surface px-3 py-2 text-sm text-text">
        {products.map((entry) => <option key={entry.name} value={entry.name}>{entry.name}</option>)}
      </select>
      <div className="flex flex-wrap gap-2">
        {product.colors.map((color) => (
          <button key={color} type="button" onClick={() => onColorChange(color)} className={`rounded-full border px-3 py-1 text-xs ${selectedColor === color ? "border-lime bg-lime/15 text-white" : "border-white/10 text-white/65"}`}>
            {color}
          </button>
        ))}
      </div>
      <p className="text-sm text-white/70">{formatPrice(product.price)}</p>
    </div>
  );
}

function FitChoice({
  label,
  products,
  selectedProduct,
  selectedColor,
  onProductChange,
  onColorChange,
}: {
  label: string;
  products: ProduitRead[];
  selectedProduct: ProduitRead;
  selectedColor: string;
  onProductChange: (id: string) => void;
  onColorChange: (color: string) => void;
}) {
  const colors = getProductColors(selectedProduct);

  return (
    <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-sand">{label}</p>
      <select value={selectedProduct.id} onChange={(event) => onProductChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-surface px-3 py-2 text-sm text-text">
        {products.map((product) => <option key={product.id} value={product.id}>{product.nom}</option>)}
      </select>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button key={color} type="button" onClick={() => onColorChange(color)} className={`rounded-full border px-3 py-1 text-xs ${selectedColor === color ? "border-lime bg-lime/15 text-white" : "border-white/10 text-white/65"}`}>
            {color}
          </button>
        ))}
      </div>
      <p className="text-sm text-white/70">{formatPrice(getProductPrice(selectedProduct))}</p>
    </div>
  );
}