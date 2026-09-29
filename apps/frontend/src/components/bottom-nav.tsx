"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth-context";

const items = [
  {
    href: "/",
    label: "Accueil",
    icon: "⌂",
  },
  {
    href: "/catalogue",
    label: "Catalogue",
    icon: "◫",
  },
  {
    href: "/favoris",
    label: "Favoris",
    icon: "♡",
  },
  {
    href: "/panier",
    label: "Panier",
    icon: "□",
  },
  {
    href: "/profil",
    label: "Profil",
    icon: "○",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { client, isLoading } = useAuth();

  const hiddenPaths = [
    "/connexion",
    "/inscription",
  ];

  if (isLoading || hiddenPaths.includes(pathname)) {
    return null;
  }

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-20 w-full max-w-[960px] items-center justify-around px-2 pb-safe">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs transition ${
                isActive
                  ? "bg-surface-2 text-text"
                  : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {item.icon}
              </span>

              <span className="font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}

        {!client ? (
          <Link
            href="/connexion"
            className="flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs text-muted transition hover:bg-surface-2 hover:text-text"
          >
            <span className="text-xl leading-none" aria-hidden="true">
              →
            </span>
            <span className="font-medium">Connexion</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

