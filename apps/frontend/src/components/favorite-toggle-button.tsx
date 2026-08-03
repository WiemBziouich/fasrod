"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";

type FavoriteToggleButtonProps = {
  productId: string;
  className?: string;
  label?: string;
};

export function FavoriteToggleButton({ productId, className = "", label = "Favori" }: FavoriteToggleButtonProps) {
  const router = useRouter();
  const { client, isLoading: isAuthLoading } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(productId);

  if (isAuthLoading) {
    return <span className={className}>...</span>;
  }

  if (!client) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          router.push("/connexion");
        }}
        className={className}
      >
        ♡
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await toggleFavorite(productId);
      }}
      className={className}
    >
      {favorite ? "♥" : "♡"}
    </button>
  );
}