"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const lastTap = useRef(0);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (active: boolean) =>
    cx(
      "whitespace-nowrap py-1 text-base transition-colors",
      active ? "font-semibold text-ink" : "text-muted hover:text-ink"
    );

  // Single tap goes home. A quick double tap reveals the phone Log Out row instead.
  function onBrandClick(e: React.MouseEvent) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastTap.current < 350) {
      lastTap.current = 0;
      setShowLogout((v) => !v);
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (lastTap.current !== 0 && Date.now() - lastTap.current >= 340) {
        lastTap.current = 0;
        router.push("/");
      }
    }, 360);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(7,11,18,0.85)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3 pb-2 pt-3 sm:gap-5 sm:py-3.5">
          <button
            type="button"
            onClick={onBrandClick}
            className="cursor-pointer select-none whitespace-nowrap text-2xl font-bold tracking-tight text-ink"
          >
            Don&apos;t Be A Monkey
          </button>

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

        {/* Phone nav. Five links, no Log Out. Double tap the brand to log out. */}
        <nav className="flex items-center justify-between gap-3 pb-2.5 sm:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))}>
              {l.label}
            </Link>
          ))}
        </nav>

        {showLogout ? (
          <form action={logout} className="flex justify-center pb-3 sm:hidden">
            <button
              type="submit"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[rgba(255,93,104,0.3)] bg-down-soft px-5 py-2.5 text-base font-semibold text-down"
            >
              Log Out
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
