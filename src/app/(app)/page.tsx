import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { trades } from "@/db/schema";
import { Button, Card, SectionTitle } from "@/components/ui";
import { loadSampleData, clearSampleData } from "@/actions/sample";
import { QuoteCard } from "@/components/QuoteCard";
import { TradeRow } from "@/components/TradeRow";
import { EquityCurve } from "@/components/EquityCurve";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { fmtMoney, fmtPct, fmtR } from "@/lib/format";
import { requireUserId } from "@/lib/session";
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
  const userId = await requireUserId();
  const db = await getDb();
  const all = await db.query.trades.findMany({
    where: eq(trades.userId, userId),
    with: { setup: true, screenshots: true },
    orderBy: [desc(trades.tradeDate), desc(trades.id)],
  });

  const pnl = totalPnl(all);
  const tiles = [
    { label: "Net PnL", value: fmtMoney(pnl), tone: pnl > 0 ? "up" : pnl < 0 ? "down" : "" },
    { label: "Win Rate", value: fmtPct(winRate(all)) },
    { label: "Avg R", value: fmtR(avgR(all)) },
    { label: "Execution", value: avgGrade(all) ?? "-" },
    { label: "Monkey Rate", value: fmtPct(monkeyRate(all)) },
    { label: "Rule Streak", value: `${ruleStreak(all)}` },
  ];

  return (
    <div className="space-y-5">
      <QuoteCard />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Card key={t.label} className="!p-4">
            <p className="text-sm font-medium text-muted">
              {t.label}
            </p>
            <p
              className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${
                t.tone === "up" ? "text-up" : t.tone === "down" ? "text-down" : ""
              }`}
            >
              {t.value}
            </p>
          </Card>
        ))}
      </div>

      {all.length === 0 ? (
        <Card className="space-y-4 text-center">
          <p className="text-base font-medium text-ink">No trades yet.</p>
          <p className="text-sm text-muted">
            Take a trade you can name, then recap it here. Or load sample data to
            explore every feature first.
          </p>
          <form action={loadSampleData}>
            <Button type="submit">Load Sample Data</Button>
          </form>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <SectionTitle>Equity Curve</SectionTitle>
              <EquityCurve points={equitySeries(all)} />
            </Card>
            <Card className="lg:col-span-2">
              <SectionTitle>Daily PnL</SectionTitle>
              <CalendarHeatmap daily={dailyPnl(all)} />
            </Card>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Recent Trades</h2>
              <Link href="/trades" className="text-sm text-accent hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {all.slice(0, 6).map((t) => (
                <TradeRow key={t.id} trade={t} />
              ))}
            </div>
          </div>

          {all.some((t) => t.isSample) ? (
            <form action={clearSampleData} className="flex justify-center pb-2">
              <Button type="submit" variant="ghost">
                Clear Sample Data
              </Button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}
