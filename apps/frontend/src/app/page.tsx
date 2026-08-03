"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";

import {
  fetchActivePromotions,
  fetchCollections,
  fetchProducts,
  type CollectionRead,
  type ProduitRead,
  type PromotionRead,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { feedCards, fitRail } from "@/lib/site";

type HomeData = {
  collections: CollectionRead[];
  promotions: PromotionRead[];
  products: ProduitRead[];
};

const initialHomeData: HomeData = {
  collections: [],
  promotions: [],
  products: [],
};

function formatCountdown(targetDate: string | null): string {
  if (!targetDate) {
    return "48:00";
  }

  const diffMs = new Date(targetDate).getTime() - Date.now();
  if (diffMs <= 0) {
    return "00:00";
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

export default function HomePage() {
  const [data, setData] = useState<HomeData>(initialHomeData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { client, isLoading: isAuthLoading } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      try {
        const [collections, promotions, productsResponse] = await Promise.all([
          fetchCollections(),
          fetchActivePromotions(),
          fetchProducts({ skip: 0, limit: 8, search: debouncedSearch || undefined }),
        ]);

        if (!active) {
          return;
        }

        setData({
          collections,
          promotions,
          products: productsResponse.items,
        });
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load Fasrord data");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadHomeData();

    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  const nextDropCountdown = formatCountdown(data.promotions[0]?.date_fin ?? null);
  const heroProduct = data.products[0];

  const navItems = [
    { href: "/", label: "Accueil", icon: HomeIcon },
    { href: "/catalogue", label: "Catalogue", icon: GridIcon },
    { href: "/favoris", label: "Favoris", icon: HeartIcon },
    { href: "/profil", label: "Profil", icon: UserIcon },
  ] as const;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <header className="sticky top-4 z-30 rounded-[28px] border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-xl shadow-glow">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink font-display text-lg font-bold tracking-tight">
            F
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm uppercase tracking-[0.3em] text-sand">Fasrord</p>
            <p className="text-xs text-white/60">Streetwear only, mobile-first</p>
          </div>
          <Link
            href="/panier"
            className="rounded-full border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-text"
          >
            Panier {itemCount > 0 ? `(${itemCount})` : ""}
          </Link>
          <Link
            href={client ? "/mes-commandes" : "/connexion"}
            className="rounded-full border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-text"
          >
            {isAuthLoading ? "Compte" : client ? "Mes commandes" : "Connexion"}
          </Link>
          {client?.is_admin ? (
            <Link
              href="/admin"
              className="rounded-full border border-border bg-text px-3 py-2 text-xs font-semibold text-bg"
            >
              Admin
            </Link>
          ) : null}
        </div>

        <label className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-muted">
          <span aria-hidden>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search t-shirts, hoodies, shorts, jeans..."
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
          />
        </label>
      </header>

      <section className="mt-5 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.collections.length > 0 ? (
          data.collections.map((collection) => (
            <button
              key={collection.id}
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              {collection.nom}
            </button>
          ))
        ) : (
          <span className="text-sm text-white/45">Loading collections...</span>
        )}
      </section>

      <section className="mt-5 rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-glow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sand">Next drop</p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">
              New summer pieces in {nextDropCountdown}.
            </h1>
          </div>
          <div className="rounded-2xl border border-lime/30 bg-lime/10 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-lime">Countdown</p>
            <p className="font-display text-lg font-bold">{nextDropCountdown}</p>
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-5 overflow-hidden rounded-[34px] border border-white/10 bg-surface shadow-glow"      >
        <div className="relative aspect-[4/5] bg-surface p-5 sm:aspect-[16/10]">
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
                Trending
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                {heroProduct ? `${heroProduct.variantes.length} variants` : isLoading ? "Loading" : "0 variants"}
              </span>
            </div>

            <div className="max-w-[20ch]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Video preview</p>
              <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-5xl">
                {heroProduct?.nom ?? "Oversized tee, baggy denim, one tap to buy."}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-[28px] border border-white/10 bg-black/20 p-3 backdrop-blur-sm">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/55">Style</p>
                <p className="mt-1 text-sm font-semibold">{heroProduct?.categorie.nom ?? "Y2K street"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/55">Price</p>
                <p className="mt-1 text-sm font-semibold">
                  {heroProduct?.prix_promo ?? heroProduct?.prix ?? "From 69 DT"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/55">Tap</p>
                <p className="mt-1 text-sm font-semibold">See fit</p>
              </div>
            </div>

            {heroProduct ? (
              <Link
                href={`/produits/${heroProduct.id}`}
                className="mt-3 inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"
              >
                Open product
              </Link>
            ) : null}
          </div>
        </div>
      </motion.section>

      <section className="mt-5 rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-glow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sand">Complete the fit</p>
            <h2 className="mt-1 font-display text-xl font-bold">Add pieces that match the same silhouette.</h2>
          </div>
          <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/90">
            View all
          </button>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {fitRail.map((item) => (
            <article
              key={item.name}
              className="w-[180px] shrink-0 rounded-[26px] border border-white/10 bg-ink/90 p-4"
            >
              <div className="aspect-[4/5] rounded-[20px] bg-gradient-to-br from-white/12 to-white/5" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-sand">{item.type}</p>
              <h3 className="mt-1 font-display text-lg font-bold">{item.name}</h3>
              <div className="mt-2 flex items-center justify-between text-sm text-white/70">
                <span>{item.price}</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[11px]">Add</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sand">Seen on Instagram</p>
            <h2 className="mt-1 font-display text-xl font-bold">Tap the outfit, open the product.</h2>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70">Live feed</span>
        </div>

        {error ? (
          <div className="mt-4 rounded-[30px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
            Failed to load Fasrord data: {error}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              Loading live catalog...
            </div>
          ) : data.products.length > 0 ? (
            data.products.map((product, index) => (
                <motion.article
                  key={product.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-glow"
                >
                  <FavoriteToggleButton
                    productId={product.id}
                    className="absolute right-4 top-4 z-10 rounded-full border border-border bg-surface-2 px-3 py-2 text-sm font-semibold text-text"
                  />
                  <Link href={`/produits/${product.id}`}>
                    <div className={`aspect-[4/5] ${feedCards[index % feedCards.length].gradient} p-4`}>
                      <div className="flex h-full flex-col justify-between rounded-[24px] border border-white/15 bg-black/20 p-4 backdrop-blur-sm">
                        <span className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
                          {product.collections[0]?.nom ?? "Featured"}
                        </span>
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Tap to shop</p>
                          <h3 className="mt-2 font-display text-2xl font-bold leading-tight">{product.nom}</h3>
                          <p className="mt-2 max-w-[24ch] text-sm text-white/80">{product.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))
          ) : (
            feedCards.map((card) => (
              <motion.article
                key={card.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-glow"
              >
                <div className={`aspect-[4/5] ${card.gradient} p-4`}>
                  <div className="flex h-full flex-col justify-between rounded-[24px] border border-white/15 bg-black/20 p-4 backdrop-blur-sm">
                    <span className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
                      {card.label}
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/70">Tap to shop</p>
                      <h3 className="mt-2 font-display text-2xl font-bold leading-tight">{card.title}</h3>
                      <p className="mt-2 max-w-[24ch] text-sm text-white/80">{card.subtitle}</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))
          )}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[520px] grid-cols-4 gap-2 text-center text-xs font-semibold text-muted">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={label} href={href} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-text">
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.6]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 10.5V20h11v-9.5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.6]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.6]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.5-8.5-9A4.8 4.8 0 0 1 12 5.5 4.8 4.8 0 0 1 20.5 11C19 15.5 12 20 12 20Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.6]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}