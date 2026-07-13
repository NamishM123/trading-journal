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
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(7,11,18,0.78)] backdrop-blur-xl backdrop-saturate-150 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-[linear-gradient(90deg,transparent_5%,rgba(69,196,255,0.45),transparent_95%)]">
      <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-3">
        <Link href="/" className="mr-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[0.65rem] font-extrabold text-accent-fg shadow-[var(--glow)]">
            TJ
          </span>
          <span className="hidden font-mono text-xs font-bold uppercase tracking-[0.1em] sm:block">
            Trading Journal
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm transition-colors",
                isActive(l.href)
                  ? "border-[rgba(69,196,255,0.3)] bg-accent-soft font-semibold text-accent"
                  : "border-transparent text-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/trades/new"
          className="whitespace-nowrap rounded-xl bg-accent px-3.5 py-1.5 text-sm font-bold text-accent-fg shadow-[var(--glow)] transition-colors hover:bg-accent-hover"
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
