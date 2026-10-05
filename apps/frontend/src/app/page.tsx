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
import { CatalogueProductCard } from "@/components/catalogue-product-card";
import { FitBuilder } from "@/components/fit-builder";

import {
  catalogueProducts,
  formatPrice,
  getCatalogueProduct,
  getProductColors,
  getProductImage,
  getProductPrice,
} from "@/lib/catalogue";

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
  if (!targetDate) return "48:00";

  const diffMs =
    new Date(targetDate).getTime() - Date.now();

  if (diffMs <= 0) return "00:00";

  const totalHours = Math.floor(
    diffMs / (1000 * 60 * 60),
  );

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return days > 0
    ? `${days}d ${hours}h`
    : `${hours}h`;
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>

      {action ? (
        <span className="hidden text-xs font-semibold text-muted sm:block">
          {action}
        </span>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const [data, setData] =
    useState<HomeData>(initialHomeData);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const {
    client,
    isLoading: isAuthLoading,
  } = useAuth();

  const { itemCount } = useCart();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () =>
      window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      try {
        const [
          collections,
          promotions,
          productsResponse,
        ] = await Promise.all([
          fetchCollections(),
          fetchActivePromotions(),
          fetchProducts({
            skip: 0,
            limit: 100,
            search:
              debouncedSearch || undefined,
          }),
        ]);

        if (!active) return;

        setData({
          collections,
          promotions,
          products:
            productsResponse.items,
        });
      } catch (loadError) {
        if (!active) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Fasrord data",
        );
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

  const nextDropCountdown =
    formatCountdown(
      data.promotions[0]?.date_fin ?? null,
    );

  const heroProduct =
    data.products.find((product) =>
      getCatalogueProduct(product.nom),
    );

  const heroCatalogueProduct =
    catalogueProducts[0];

  const heroImage = heroProduct
    ? getProductImage(heroProduct)
    : undefined;

  const legacyProducts =
    data.products.filter(
      (product) =>
        !getCatalogueProduct(product.nom),
    );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-24 pt-3 sm:px-6 md:pb-10 lg:px-8">

      {/* HEADER */}

      <header className="sticky top-3 z-40 rounded-[24px] border border-white/10 bg-[#111110]/90 px-3 py-3 shadow-glow backdrop-blur-xl sm:px-4">

        <div className="flex items-center gap-3">

          <Link
            href="/"
            aria-label="Fasrord accueil"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper font-display text-base font-bold text-ink"
          >
            F
          </Link>

          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em]">
              Fasrord
            </p>

            <p className="hidden text-[10px] text-muted sm:block">
              Streetwear made for everyday movement.
            </p>
          </div>

          <nav className="hidden items-center gap-5 text-xs font-semibold text-muted md:flex">

            <Link
              href="/catalogue"
              className="transition hover:text-text"
            >
              Catalogue
            </Link>

            <Link
              href="/favoris"
              className="transition hover:text-text"
            >
              Favoris
            </Link>

            <Link
              href={
                client
                  ? "/profil"
                  : "/connexion"
              }
              className="transition hover:text-text"
            >
              {isAuthLoading
                ? "Compte"
                : client
                  ? "Profil"
                  : "Connexion"}
            </Link>

          </nav>

          <Link
            href="/panier"
            className="rounded-full border border-border bg-surface2 px-3 py-2 text-[11px] font-semibold"
          >
            Panier{" "}
            {itemCount > 0
              ? `(${itemCount})`
              : ""}
          </Link>

        </div>

        {/* SEARCH */}

        <label className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-surface2/70 px-3 py-2.5 text-muted">

          <span
            aria-hidden
            className="text-sm"
          >
            ⌕
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher t-shirts, hoodies, baggys..."
            className="w-full bg-transparent text-xs text-text outline-none placeholder:text-muted"
          />

        </label>

      </header>


      {/* COLLECTION PILLS */}

      <section className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {isLoading ? (
          <>
            <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-surface2" />
            <div className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-surface2" />
            <div className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-surface2" />
          </>
        ) : (
          data.collections.slice(0, 4).map((collection) => (
            <Link
              key={collection.id}
              href="/catalogue"
              className="shrink-0 rounded-full border border-border bg-surface2 px-3.5 py-2 text-[11px] font-semibold transition hover:border-white/30 hover:bg-white/10"
            >
              {collection.nom}
            </Link>
          ))
        )}

      </section>


      {/* HERO */}

      <motion.section
        initial={{
          opacity: 0,
          y: 18,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
        className="relative mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-surface shadow-glow"
      >

        <div className="grid min-h-[430px] md:grid-cols-[0.9fr_1.1fr]">

          {/* HERO TEXT */}

          <div className="relative z-10 flex flex-col justify-between p-6 sm:p-8 md:p-10">

            <div>

              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">
                Fasrord / Summer drop
              </span>

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Streetwear, your way.
              </p>

              <h1 className="mt-3 max-w-[11ch] font-display text-5xl font-bold leading-[0.92] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Wear your{" "}
                <span className="text-white/45">
                  attitude.
                </span>
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-6 text-muted">
                Des coupes loose, des pièces faciles
                à mixer et les essentiels Fasrord
                pour construire ton propre fit.
              </p>

            </div>


            <div className="mt-8 flex flex-wrap gap-2">

              <Link
                href="/catalogue"
                className="rounded-full bg-paper px-5 py-3 text-xs font-bold text-ink transition hover:scale-[1.02]"
              >
                Shop the drop
              </Link>

              <a
                href="#collections"
                className="rounded-full border border-border bg-black/20 px-5 py-3 text-xs font-semibold"
              >
                Explorer
              </a>

            </div>

          </div>


          {/* HERO IMAGE */}

          <Link
            href={
              heroProduct
                ? `/produits/${heroProduct.id}`
                : "/catalogue"
            }
            className="group relative min-h-[300px] overflow-hidden bg-[#181817]"
          >

            {heroImage ? (
              <img
                src={heroImage.url}
                alt={
                  heroImage.alt_text ??
                  heroProduct?.nom ??
                  heroCatalogueProduct.name
                }
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_75%_70%,rgba(255,255,255,0.08),transparent_30%)]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-[#111110] via-transparent to-transparent md:from-[#111110] md:via-[#111110]/10" />

            <div className="absolute bottom-5 right-5 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur">
              {heroProduct?.nom ??
                heroCatalogueProduct.name}
            </div>

          </Link>

        </div>

      </motion.section>


      {/* NEXT DROP */}

      <section className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.025] p-4 sm:p-5">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-muted">
              Next drop
            </p>

            <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">
              New summer pieces.
            </h2>

          </div>

          <div className="flex items-center gap-3">

            <span className="text-[9px] uppercase tracking-[0.2em] text-muted">
              Countdown
            </span>

            <span className="rounded-xl border border-white/20 bg-surface2 px-3 py-2 font-display text-sm font-bold">
              {nextDropCountdown}
            </span>

          </div>

        </div>

      </section>


      {/* COLLECTIONS */}

      <section
        id="collections"
        className="mt-12 scroll-mt-28"
      >

        <SectionHeading
          eyebrow="Shop by collection"
          title="Find your lane."
          action="Explore"
        />

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

          {data.collections.slice(0, 4).map(
            (collection, index) => (

              <Link
                key={collection.id}
                href="/catalogue"
                className="group relative min-h-[180px] overflow-hidden rounded-[24px] border border-white/10 bg-surface p-4"
              >

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.10),transparent_32%)]" />

                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/10 transition duration-500 group-hover:scale-125" />

                <div className="relative flex h-full flex-col justify-between">

                  <span className="w-fit rounded-full border border-white/10 px-2 py-1 text-[8px] uppercase tracking-[0.22em] text-muted">
                    0{index + 1}
                  </span>

                  <div>

                    <h3 className="font-display text-xl font-bold leading-tight">
                      {collection.nom}
                    </h3>

                    <span className="mt-3 inline-flex text-[10px] font-semibold text-muted group-hover:text-text">
                      Shop collection →
                    </span>

                  </div>

                </div>

              </Link>

            ),
          )}

        </div>

      </section>


      {/* TRENDING */}

      <section className="mt-12">

        <SectionHeading
          eyebrow="Trending now"
          title="Pieces getting attention."
        />

        {heroProduct ? (

          <Link
            href={`/produits/${heroProduct.id}`}
            className="group mt-5 grid overflow-hidden rounded-[28px] border border-white/10 bg-surface md:grid-cols-[1.2fr_0.8fr]"
          >

            <div className="relative min-h-[360px] overflow-hidden bg-[#171716]">

              {heroImage ? (
                <img
                  src={heroImage.url}
                  alt={
                    heroImage.alt_text ??
                    heroProduct.nom
                  }
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                />
              ) : null}

              <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] backdrop-blur">
                Trending
              </div>

            </div>


            <div className="flex flex-col justify-between p-6 sm:p-8">

              <div>

                <p className="text-[9px] uppercase tracking-[0.25em] text-muted">
                  Featured piece
                </p>

                <h3 className="mt-3 font-display text-4xl font-bold leading-none">
                  {heroProduct.nom}
                </h3>

                <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
                  {heroProduct.categorie.nom}
                  {" · "}
                  {getProductColors(
                    heroProduct,
                  ).join(" · ")}
                </p>

              </div>


              <div className="mt-10 flex items-end justify-between gap-4">

                <span className="font-display text-2xl font-bold">
                  {formatPrice(
                    getProductPrice(
                      heroProduct,
                    ),
                  )}
                </span>

                <span className="rounded-full bg-paper px-4 py-2.5 text-[10px] font-bold text-ink">
                  View product →
                </span>

              </div>

            </div>

          </Link>

        ) : (

          <div className="mt-5 rounded-[28px] border border-white/10 bg-surface p-8 text-sm text-muted">
            Les produits tendance seront affichés ici.
          </div>

        )}

      </section>


      {/* FIT BUILDER */}

      <section className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.025] p-4 sm:p-6">

        <div>

          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-muted">
            Build your fit
          </p>

          <h2 className="mt-1 font-display text-2xl font-bold">
            Compose ton outfit.
          </h2>

          <p className="mt-2 text-sm text-muted">
            Associe n&apos;importe quel baggy avec
            n&apos;importe quel t-shirt.
          </p>

        </div>

        <div className="mt-5">
          <FitBuilder products={data.products} />
        </div>

      </section>


      {/* PRODUCTS */}

      <section className="mt-12">

        <SectionHeading
          eyebrow="Seen on Instagram"
          title="Tap. Shop. Wear."
          action="Live catalog"
        />

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
            Failed to load Fasrord data:
            {" "}
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">

          {isLoading ? (

            <div className="col-span-full rounded-2xl border border-white/10 bg-surface p-6 text-sm text-muted">
              Loading live catalog...
            </div>

          ) : (

            <>

              {catalogueProducts.map(
                (product) => {

                  const apiProduct =
                    data.products.find(
                      (entry) =>
                        entry.nom ===
                        product.name,
                    );

                  return (
                    <CatalogueProductCard
                      key={product.name}
                      product={product}
                      productId={
                        apiProduct?.id
                      }
                      image={
                        apiProduct
                          ? getProductImage(
                              apiProduct,
                            )
                          : undefined
                      }
                    />
                  );
                },
              )}


              {legacyProducts.map(
                (product) => {

                  const productImage =
                    getProductImage(
                      product,
                    );

                  return (

                    <motion.article
                      key={product.id}
                      whileHover={{
                        y: -3,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className="relative overflow-hidden rounded-[22px] border border-white/10 bg-surface"
                    >

                      <FavoriteToggleButton
                        productId={product.id}
                        className="absolute right-3 top-3 z-10 rounded-full border border-border bg-black/60 px-2.5 py-1.5 text-xs backdrop-blur"
                      />

                      <Link
                        href={`/produits/${product.id}`}
                      >

                        <div className="aspect-[4/5] overflow-hidden bg-surface2">

                          {productImage ? (

                            <img
                              src={
                                productImage.url
                              }
                              alt={
                                productImage.alt_text ??
                                product.nom
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            <div className="h-full w-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%)]" />

                          )}

                        </div>

                        <div className="p-3.5">

                          <p className="text-[8px] uppercase tracking-[0.2em] text-muted">
                            {product
                              .collections[0]
                              ?.nom ??
                              "Featured"}
                          </p>

                          <h3 className="mt-1 font-display text-base font-bold leading-tight">
                            {product.nom}
                          </h3>

                          <p className="mt-1 text-xs font-semibold">
                            {formatPrice(
                              getProductPrice(
                                product,
                              ),
                            )}
                          </p>

                        </div>

                      </Link>

                    </motion.article>

                  );
                },
              )}

            </>

          )}

        </div>

      </section>


      {/* JOURNAL */}

      <section className="mt-12 overflow-hidden rounded-[28px] border border-white/10 bg-surface p-6 sm:p-8">

        <div className="max-w-2xl">

          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-muted">
            Fasrord Journal
          </p>

          <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
            The fit is yours.
            <br />
            The rules are not.
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted">
            Inspiration, drops et nouveaux fits
            arrivent ici. Les visuels éditoriaux
            pourront être ajoutés quand tes images
            seront prêtes.
          </p>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="mt-12 border-t border-white/10 pt-6 text-xs text-muted">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <span className="font-display font-bold uppercase tracking-[0.25em] text-text">
            Fasrord
          </span>

          <span>
            Streetwear · Tunisia
          </span>

        </div>

      </footer>

    </main>
  );
}