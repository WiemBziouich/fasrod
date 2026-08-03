"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { addFavori, fetchMesFavoris, removeFavori, type FavoriRead } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type FavoritesContextValue = {
  favorites: FavoriRead[];
  favoriteProductIds: Set<string>;
  isLoading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { client, accessToken, isLoading: isAuthLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFavorites = useCallback(async () => {
    if (!client || !accessToken) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const favoriteList = await fetchMesFavoris(accessToken);
      setFavorites(favoriteList);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, client]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void refreshFavorites();
  }, [isAuthLoading, refreshFavorites]);

  const favoriteProductIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.produit.id)),
    [favorites],
  );

  const isFavorite = useCallback((productId: string) => favoriteProductIds.has(productId), [favoriteProductIds]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!client || !accessToken) {
        return;
      }

      const favoriteExists = favoriteProductIds.has(productId);

      if (favoriteExists) {
        await removeFavori(productId, accessToken);
        setFavorites((currentFavorites) => currentFavorites.filter((favorite) => favorite.produit.id !== productId));
        return;
      }

      const createdFavorite = await addFavori(productId, accessToken);
      setFavorites((currentFavorites) => [createdFavorite, ...currentFavorites.filter((favorite) => favorite.produit.id !== productId)]);
    },
    [accessToken, client, favoriteProductIds],
  );

  const value = useMemo(
    () => ({ favorites, favoriteProductIds, isLoading, isFavorite, toggleFavorite, refreshFavorites }),
    [favorites, favoriteProductIds, isLoading, isFavorite, toggleFavorite, refreshFavorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}