"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";
import { logout } from "@/actions/auth";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/trades", label: "Trades" },
  { href: "/playbook", label: "Playbook" },
  { href: "/journal", label: "Daily Journal" },
  { href: "/stats", label: "Stats" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-fg">
            TJ
          </span>
          <span className="hidden text-sm font-semibold sm:block">
            Trading Journal
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors",
                isActive(l.href)
                  ? "bg-surface-2 font-medium text-ink"
                  : "text-muted hover:text-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/trades/new"
          className="whitespace-nowrap rounded-xl bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          New Recap
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:text-ink"
            title="Log out"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
