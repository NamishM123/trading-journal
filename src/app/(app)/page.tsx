import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { trades } from "@/db/schema";
import { Button, Card, SectionTitle } from "@/components/ui";
import { loadSampleData, clearSampleData } from "@/actions/sample";
import { QuoteCard } from "@/components/QuoteCard";
import { TradeRow } from "@/components/TradeRow";
import { EquityCurve } from "@/components/EquityCurve";
import { MonthCalendar } from "@/components/MonthCalendar";
import { fmtMoney, fmtPct, fmtR } from "@/lib/format";
import { requireUserId } from "@/lib/session";
import {
  avgGrade,
  dailyPnl,
  disciplineScore,
  equitySeries,
  monkeyRate,
  ruleStreak,
  totalPnl,
  winRate,
  avgR,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cal?: string }>;
}) {
  const { cal } = await searchParams;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const month = cal && /^\d{4}-(0[1-9]|1[0-2])$/.test(cal) ? cal : thisMonth;

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
          <DisciplineCard trades={all} />

          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <SectionTitle>Equity Curve</SectionTitle>
              <EquityCurve points={equitySeries(all)} />
            </Card>
            <Card className="lg:col-span-2">
              <SectionTitle>Calendar</SectionTitle>
              <MonthCalendar daily={dailyPnl(all)} month={month} />
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Recent Trades</h2>
              <Link href="/trades" className="text-base text-accent hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-2.5">
              {all.slice(0, 6).map((t) => (
                <TradeRow key={t.id} trade={t} />
              ))}
            </div>
          </Card>

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

function DisciplineCard({ trades: all }: { trades: Parameters<typeof disciplineScore>[0] }) {
  const { score, band, components } = disciplineScore(all);
  if (score == null) return null;

  const tone =
    score >= 85 ? "text-up" : score >= 70 ? "text-ink" : score >= 50 ? "text-warn" : "text-down";
  const barColor = (v: number) =>
    v >= 0.85 ? "var(--chart-up)" : v >= 0.6 ? "var(--warn)" : "var(--chart-down)";

  return (
    <Card>
      <SectionTitle>
        Discipline Score
      </SectionTitle>
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center sm:pr-8 sm:text-left">
          <p className={`font-mono text-6xl font-bold tabular-nums ${tone}`}>{score}</p>
          <p className="mt-1 text-base font-semibold text-muted">{band}</p>
        </div>
        <div className="space-y-3">
          {components.map((c) =>
            c.value == null ? null : (
              <div key={c.label} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-sm text-muted">{c.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(c.value * 100)}%`,
                      backgroundColor: barColor(c.value),
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted">
                  {Math.round(c.value * 100)}%
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </Card>
  );
}
