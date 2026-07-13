import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { trades } from "@/db/schema";
import { EmptyState } from "@/components/ui";
import { TradeRow } from "@/components/TradeRow";
import { LOCATIONS, GRADES } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Search = {
  setup?: string;
  location?: string;
  grade?: string;
  result?: string;
};

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const db = await getDb();
  const [all, setupList] = await Promise.all([
    db.query.trades.findMany({
      with: { setup: true, screenshots: true },
      orderBy: [desc(trades.tradeDate), desc(trades.id)],
    }),
    db.query.setups.findMany(),
  ]);

  const filtered = all.filter((t) => {
    if (params.setup === "nolabel" && !t.noLabel) return false;
    if (params.setup && params.setup !== "nolabel" && String(t.setupId) !== params.setup)
      return false;
    if (params.location && t.location !== params.location) return false;
    if (params.grade && t.executionGrade !== params.grade) return false;
    if (params.result === "win" && t.pnl <= 0) return false;
    if (params.result === "loss" && t.pnl >= 0) return false;
    return true;
  });

  // Filters are plain links so the page stays a server component.
  const link = (patch: Partial<Search>) => {
    const merged = { ...params, ...patch };
    const q = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return q ? `/trades?${q}` : "/trades";
  };

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors ${
      active
        ? "border-accent bg-accent-soft text-accent font-medium"
        : "border-line text-muted hover:text-ink"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Trades</h1>
        <span className="text-sm text-muted">
          {filtered.length} of {all.length}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={link({ setup: undefined })} className={chip(!params.setup)}>
          All setups
        </Link>
        {setupList.map((s) => (
          <Link
            key={s.id}
            href={link({ setup: String(s.id) })}
            className={chip(params.setup === String(s.id))}
          >
            {s.name}
          </Link>
        ))}
        <Link href={link({ setup: "nolabel" })} className={chip(params.setup === "nolabel")}>
          Unlabeled
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LOCATIONS.map((l) => (
          <Link
            key={l.value}
            href={link({ location: params.location === l.value ? undefined : l.value })}
            className={chip(params.location === l.value)}
          >
            {l.value === "taper" ? "Taper" : l.value === "monkey" ? "Monkey" : "Unsure"}
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-line-strong" />
        {GRADES.map((g) => (
          <Link
            key={g}
            href={link({ grade: params.grade === g ? undefined : g })}
            className={chip(params.grade === g)}
          >
            {g}
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-line-strong" />
        {(["win", "loss"] as const).map((r) => (
          <Link
            key={r}
            href={link({ result: params.result === r ? undefined : r })}
            className={chip(params.result === r)}
          >
            {r === "win" ? "Winners" : "Losers"}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No trades match." hint="Loosen the filters or log a new recap." />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TradeRow key={t.id} trade={t} />
          ))}
        </div>
      )}
    </div>
  );
}
