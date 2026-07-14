"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";
import { logout } from "@/actions/auth";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/trades", label: "Trades" },
  { href: "/playbook", label: "Playbook" },
  { href: "/journal", label: "Journal" },
  { href: "/stats", label: "Stats" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (active: boolean) =>
    cx(
      "whitespace-nowrap py-1 text-[13px] transition-colors min-[400px]:text-sm sm:text-base",
      active ? "font-semibold text-ink" : "text-muted hover:text-ink"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(7,11,18,0.85)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top row. Brand on the left, primary action on the right, nav inline on desktop. */}
        <div className="flex items-center gap-5 pb-2 pt-3 sm:py-3.5">
          <Link
            href="/"
            className="whitespace-nowrap text-[21px] font-bold tracking-tight text-ink sm:text-2xl"
          >
            Don&apos;t Be A Monkey
          </Link>

          <nav className="hidden flex-1 items-center gap-6 pl-2 sm:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/trades/new"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-accent px-5 py-2.5 text-base font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              New Recap
            </Link>
            <form action={logout} className="hidden sm:block">
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-2.5 text-base font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Log Out
              </button>
            </form>
          </div>
        </div>

        {/* Mobile nav row. Every link plus Log Out fits on screen with no scrolling. */}
        <nav className="flex items-center justify-between gap-2 pb-2.5 min-[400px]:gap-3 sm:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))}>
              {l.label}
            </Link>
          ))}
          <form action={logout}>
            <button
              type="submit"
              className="whitespace-nowrap py-1 text-[13px] text-muted transition-colors min-[400px]:text-sm hover:text-ink"
            >
              Log Out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
