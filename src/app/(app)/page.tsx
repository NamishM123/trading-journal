import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { trades } from "@/db/schema";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { QuoteCard } from "@/components/QuoteCard";
import { TradeRow } from "@/components/TradeRow";
import { EquityCurve } from "@/components/EquityCurve";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { fmtMoney, fmtPct, fmtR } from "@/lib/format";
import {
  avgGrade,
  dailyPnl,
  equitySeries,
  monkeyRate,
  ruleStreak,
  totalPnl,
  winRate,
  avgR,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = await getDb();
  const all = await db.query.trades.findMany({
    with: { setup: true, screenshots: true },
    orderBy: [desc(trades.tradeDate), desc(trades.id)],
  });

  const pnl = totalPnl(all);
  const tiles = [
    { label: "Net PnL", value: fmtMoney(pnl), tone: pnl > 0 ? "up" : pnl < 0 ? "down" : "" },
    { label: "Win rate", value: fmtPct(winRate(all)) },
    { label: "Avg R", value: fmtR(avgR(all)) },
    { label: "Execution", value: avgGrade(all) ?? "—" },
    { label: "Monkey rate", value: fmtPct(monkeyRate(all)) },
    { label: "Rule streak", value: `${ruleStreak(all)}` },
  ];

  return (
    <div className="space-y-5">
      <QuoteCard />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Card key={t.label} className="!p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">
              {t.label}
            </p>
            <p
              className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                t.tone === "up" ? "text-up" : t.tone === "down" ? "text-down" : ""
              }`}
            >
              {t.value}
            </p>
          </Card>
        ))}
      </div>

      {all.length === 0 ? (
        <EmptyState
          title="No trades yet."
          hint="Take a trade you can name, then recap it here."
        />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <SectionTitle>Equity curve</SectionTitle>
              <EquityCurve points={equitySeries(all)} />
            </Card>
            <Card className="lg:col-span-2">
              <SectionTitle>Daily PnL</SectionTitle>
              <CalendarHeatmap daily={dailyPnl(all)} />
            </Card>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent trades</h2>
              <Link href="/trades" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {all.slice(0, 6).map((t) => (
                <TradeRow key={t.id} trade={t} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
