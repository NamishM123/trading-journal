import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups, trades } from "@/db/schema";
import { Card, EmptyState } from "@/components/ui";
import { TradeRow } from "@/components/TradeRow";
import { LOCATIONS, GRADES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

type Search = {
  setup?: string;
  location?: string;
  grade?: string;
  result?: string;
  date?: string;
};

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const userId = await requireUserId();
  const db = await getDb();
  const [all, setupList] = await Promise.all([
    db.query.trades.findMany({
      where: eq(trades.userId, userId),
      with: { setup: true, screenshots: true },
      orderBy: [desc(trades.tradeDate), desc(trades.id)],
    }),
    db.query.setups.findMany({ where: eq(setups.userId, userId) }),
  ]);

  const filtered = all.filter((t) => {
    if (params.date && t.tradeDate !== params.date) return false;
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
    `whitespace-nowrap rounded-full border px-4 py-2 text-base transition-colors ${
      active
        ? "border-accent bg-accent-soft font-semibold text-accent"
        : "border-line text-muted hover:text-ink"
    }`;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Trades</h1>
          <span className="text-base text-muted">
            {filtered.length} of {all.length}
          </span>
        </div>

        {params.date ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className={chip(true)}>{fmtDate(params.date)}</span>
            <Link
              href={link({ date: undefined })}
              className="text-base text-accent hover:underline"
            >
              Show All Days
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2.5">
        <Link href={link({ setup: undefined })} className={chip(!params.setup)}>
          All Setups
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

        <div className="flex flex-wrap items-center gap-2.5">
        {LOCATIONS.map((l) => (
          <Link
            key={l.value}
            href={link({ location: params.location === l.value ? undefined : l.value })}
            className={chip(params.location === l.value)}
          >
            {l.value === "taper" ? "Taper" : l.value === "monkey" ? "Monkey" : "Unsure"}
          </Link>
        ))}
        {GRADES.map((g) => (
          <Link
            key={g}
            href={link({ grade: params.grade === g ? undefined : g })}
            className={chip(params.grade === g)}
          >
            {g}
          </Link>
        ))}
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
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No trades match." />
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
