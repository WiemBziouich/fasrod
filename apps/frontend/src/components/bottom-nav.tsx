"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


const items = [
  {
    href: "/",
    label: "Accueil",
    icon: HomeIcon,
  },
  {
    href: "/catalogue",
    label: "Catalogue",
    icon: GridIcon,
  },
  {
    href: "/favoris",
    label: "Favoris",
    icon: HeartIcon,
  },
  {
    href: "/profil",
    label: "Profil",
    icon: UserIcon,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const hiddenPaths = [
    "/connexion",
    "/inscription",
  ];

  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0d0d0d] backdrop-blur-md"
    >
      <div className="mx-auto grid h-[100px] w-full max-w-[720px] grid-cols-4 items-center px-4 pb-safe">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-2 rounded-none px-2 py-2 text-sm transition ${
                isActive
                  ? "text-[#f3f0e8]"
                  : "text-[#c9c5bd] hover:text-[#f3f0e8]"
              }`}
            >
              <Icon />
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.6]"><path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 10.5V20h11v-9.5" /></svg>;
}

function GridIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.6]"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" /></svg>;
}

function HeartIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.6]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.5-8.5-9A4.8 4.8 0 0 1 12 5.5 4.8 4.8 0 0 1 20.5 11C19 15.5 12 20 12 20Z" /></svg>;
}

function UserIcon() {
  return <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.6]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 20a7 7 0 0 1 14 0" /></svg>;
}

