"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  varianteId: string;
  produitId: string;
  nom: string;
  taille: string;
  couleur: string;
  prix: string;
  quantite: number;
  image?: string;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantite"> & { quantite?: number }) => void;
  updateQuantity: (varianteId: string, quantite: number) => void;
  removeItem: (varianteId: string) => void;
  clearCart: () => void;
};

const storageKey = "fasrord_cart_v1";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function parseStoredCart(rawValue: string | null): CartItem[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parsePrice(price: string): number {
  const normalized = price.replace(/[^0-9,.-]/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setItems(parseStoredCart(window.localStorage.getItem(storageKey)));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, isHydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantite"> & { quantite?: number }) => {
    setItems((currentItems) => {
      const nextQuantity = item.quantite ?? 1;
      const existingItem = currentItems.find((entry) => entry.varianteId === item.varianteId);

      if (existingItem) {
        return currentItems.map((entry) =>
          entry.varianteId === item.varianteId
            ? { ...entry, quantite: entry.quantite + nextQuantity }
            : entry,
        );
      }

      return [...currentItems, { ...item, quantite: nextQuantity }];
    });
  }, []);

  const updateQuantity = useCallback((varianteId: string, quantite: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) => (item.varianteId === varianteId ? { ...item, quantite } : item))
        .filter((item) => item.quantite > 0),
    );
  }, []);

  const removeItem = useCallback((varianteId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.varianteId !== varianteId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(() => items.reduce((total, item) => total + item.quantite, 0), [items]);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + parsePrice(item.prix) * item.quantite, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, itemCount, total, addItem, updateQuantity, removeItem, clearCart }),
    [items, itemCount, total, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}