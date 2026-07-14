"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";
import { logout } from "@/actions/auth";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/trades", label: "Trades" },
  { href: "/playbook", label: "Playbook" },
  { href: "/journal", label: "Journal" },
  { href: "/stats", label: "Stats" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(7,11,18,0.78)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="whitespace-nowrap text-2xl font-bold tracking-tight text-ink"
        >
          Don&apos;t Be A Monkey
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:order-last">
          <Link
            href="/trades/new"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-accent px-5 py-2.5 text-base font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            New Recap
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-2.5 text-base font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Log Out
            </button>
          </form>
        </div>

        <nav className="-mb-1 flex w-full items-center gap-4 overflow-x-auto pb-1 sm:mb-0 sm:w-auto sm:flex-1 sm:gap-5 sm:pb-0">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "whitespace-nowrap py-1 text-[15px] transition-colors sm:text-base",
                isActive(l.href)
                  ? "font-semibold text-ink"
                  : "text-muted hover:text-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
