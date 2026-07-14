import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { trades } from "@/db/schema";
import { Button, Card, SectionTitle } from "@/components/ui";
import { loadSampleData, clearSampleData } from "@/actions/sample";
import { QuoteCard } from "@/components/QuoteCard";
import { EquityCurve } from "@/components/EquityCurve";
import { MonthCalendar } from "@/components/MonthCalendar";
import { fmtMoney, fmtPct, fmtR, todayISO } from "@/lib/format";
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

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cal?: string; range?: string }>;
}) {
  const { cal, range: rawRange } = await searchParams;
  const range = RANGES.some((r) => r.key === rawRange) ? rawRange! : "all";
  const thisMonth = new Date().toISOString().slice(0, 7);
  const month = cal && /^\d{4}-(0[1-9]|1[0-2])$/.test(cal) ? cal : thisMonth;

  const userId = await requireUserId();
  const db = await getDb();
  const all = await db.query.trades.findMany({
    where: eq(trades.userId, userId),
    with: { setup: true, screenshots: true },
    orderBy: [desc(trades.tradeDate), desc(trades.id)],
  });

  const today = todayISO();
  const monthPrefix = today.slice(0, 7);
  const monday = new Date(today + "T12:00:00");
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);

  const shown = all.filter((t) => {
    if (range === "today") return t.tradeDate === today;
    if (range === "week") return t.tradeDate >= weekStart;
    if (range === "month") return t.tradeDate.startsWith(monthPrefix);
    return true;
  });

  const pnl = totalPnl(shown);
  const tiles = [
    { label: "Net PnL", value: fmtMoney(pnl), tone: pnl > 0 ? "up" : pnl < 0 ? "down" : "" },
    { label: "Win Rate", value: fmtPct(winRate(shown)) },
    { label: "Avg R", value: fmtR(avgR(shown)) },
    { label: "Execution", value: avgGrade(shown) ?? "-" },
    { label: "Monkey Rate", value: fmtPct(monkeyRate(shown)) },
    { label: "Rule Streak", value: `${ruleStreak(shown)}` },
  ];

  return (
    <div className="space-y-5">
      <QuoteCard />

      <Card className="!p-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={r.key === "all" ? "/" : `/?range=${r.key}`}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-base transition-colors ${
                range === r.key
                  ? "border-accent bg-accent-soft font-semibold text-accent"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Card key={t.label} className="!p-4">
            <p className="text-base font-medium text-muted">
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
          <DisciplineCard trades={shown} />

          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <SectionTitle>Equity Curve</SectionTitle>
              <EquityCurve points={equitySeries(shown)} />
            </Card>
            <Card className="lg:col-span-2">
              <SectionTitle>Calendar</SectionTitle>
              <MonthCalendar daily={dailyPnl(all)} month={month} />
            </Card>
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
        <div className="flex items-baseline justify-center gap-3 sm:flex-col sm:items-start sm:justify-start sm:gap-1 sm:pr-8">
          <p className={`font-mono text-2xl font-bold tabular-nums ${tone}`}>{score}</p>
          <p className="text-base font-semibold text-muted">{band}</p>
        </div>
        <div className="space-y-3">
          {components.map((c) =>
            c.value == null ? null : (
              <div key={c.label} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-base text-muted">{c.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(c.value * 100)}%`,
                      backgroundColor: barColor(c.value),
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-base tabular-nums text-muted">
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
