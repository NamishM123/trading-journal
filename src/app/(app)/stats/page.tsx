import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups, trades } from "@/db/schema";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { PnlText } from "@/components/badges";
import { fmtDateShort, fmtMoney, fmtPct, fmtR } from "@/lib/format";
import {
  avgWinLoss,
  maxDrawdown,
  profitFactor,
  sessionBucket,
  SESSION_BUCKETS,
  statsForTrades,
  violations,
  weekdayOf,
  type SetupStats,
} from "@/lib/stats";
import { requireUserId } from "@/lib/session";
import {
  EDGE_TYPES,
  EMOTIONS,
  EXECUTION_TIMINGS,
  GRADES,
  MANAGEMENT_MISTAKES,
  RISK_ACCEPTANCE_AFTER_ENTRY,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const userId = await requireUserId();
  const db = await getDb();
  const [allSetups, all] = await Promise.all([
    db
      .select()
      .from(setups)
      .where(eq(setups.userId, userId))
      .orderBy(asc(setups.sortOrder), asc(setups.id)),
    db.query.trades.findMany({
      where: eq(trades.userId, userId),
      with: { setup: true, screenshots: true },
      orderBy: [desc(trades.tradeDate), desc(trades.id)],
    }),
  ]);

  if (all.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState title="No data yet." />
      </div>
    );
  }

  const taper = all.filter((t) => t.location === "taper");
  const monkey = all.filter((t) => t.location === "monkey");
  const taperStats = statsForTrades(taper);
  const monkeyStats = statsForTrades(monkey);
  const viols = violations(all);

  const bySetup = allSetups
    .map((s) => ({ setup: s, stats: statsForTrades(all.filter((t) => t.setupId === s.id)) }))
    .filter((r) => r.stats.count > 0);
  const noLabelTrades = all.filter((t) => t.noLabel);
  const noLabelStats = statsForTrades(noLabelTrades);

  const group = <T,>(items: readonly T[], label: (i: T) => string, match: (i: T) => (t: (typeof all)[number]) => boolean) =>
    items
      .map((i) => {
        const ts = all.filter(match(i));
        return { label: label(i), stats: statsForTrades(ts) };
      })
      .filter((r) => r.stats.count > 0);

  const byGrade = GRADES.map((g) => ({
    grade: g,
    stats: statsForTrades(all.filter((t) => t.executionGrade === g)),
  })).filter((r) => r.stats.count > 0);
  const maxGradePnl = Math.max(1, ...byGrade.map((b) => Math.abs(b.stats.pnl)));

  const byEmotion = group(EMOTIONS, (e) => e, (e) => (t) => t.emotionBefore === e);
  const byEdgeType = group(
    EDGE_TYPES,
    (e) => e.label.split(",")[0],
    (e) => (t) => t.edgeType === e.value
  );
  const byRiskAcceptance = group(
    RISK_ACCEPTANCE_AFTER_ENTRY,
    (r) => r,
    (r) => (t) => t.riskAcceptanceAfterEntry === r
  );
  const byTiming = group(EXECUTION_TIMINGS, (tm) => tm, (tm) => (t) => t.executionTiming === tm);
  const byMistake = group(
    MANAGEMENT_MISTAKES.filter((m) => m !== "None"),
    (m) => m,
    (m) => (t) => t.managementMistake === m
  );
  const byWeekday = group(
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const,
    (d) => d,
    (d) => (t) => weekdayOf(t.tradeDate) === d
  );
  const bySession = group(SESSION_BUCKETS, (b) => b, (b) => (t) => sessionBucket(t.entryTime) === b);

  const pf = profitFactor(all);
  const dd = maxDrawdown(all);
  const { avgWin, avgLoss } = avgWinLoss(all);
  const overall = statsForTrades(all);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <SectionTitle>Performance</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          <PerfStat
            label="Profit Factor"
            value={pf == null ? "-" : pf === Infinity ? "∞" : pf.toFixed(2)}
          />
          <PerfStat label="Max Drawdown" value={fmtMoney(-dd)} tone={dd > 0 ? "down" : undefined} />
          <PerfStat
            label="Avg Win"
            value={avgWin != null ? fmtMoney(avgWin) : "-"}
            tone={avgWin != null ? "up" : undefined}
          />
          <PerfStat
            label="Avg Loss"
            value={avgLoss != null ? fmtMoney(avgLoss) : "-"}
            tone={avgLoss != null ? "down" : undefined}
          />
          <PerfStat
            label="Expectancy Per Trade"
            value={overall.expectancy != null ? fmtMoney(overall.expectancy) : "-"}
          />
        </div>
      </Card>

      <BreakdownCard title="Day Of Week" rows={byWeekday} />
      <BreakdownCard title="Time Of Day" rows={bySession} />

      <Card>
        <SectionTitle>Edge By Setup</SectionTitle>
        <div className="divide-y divide-line/60">
          {bySetup.map(({ setup, stats }) => (
            <StatRow
              key={setup.id}
              label={setup.name}
              stats={stats}
              extra={`${fmtR(stats.avgR)} avg · ${
                stats.expectancy != null ? fmtMoney(stats.expectancy) : "-"
              } per trade`}
            />
          ))}
          {noLabelTrades.length > 0 ? (
            <StatRow
              label="Unlabeled (violations)"
              labelClassName="text-warn"
              stats={noLabelStats}
              extra={`${fmtR(noLabelStats.avgR)} avg · ${
                noLabelStats.expectancy != null ? fmtMoney(noLabelStats.expectancy) : "-"
              } per trade`}
            />
          ) : null}
        </div>
      </Card>

      <Card>
        <SectionTitle>Taper Vs Monkey</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="text-base font-medium">Taper, Edge Or Excess</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              <PnlText value={taperStats.pnl} className="text-2xl" />
            </p>
            <p className="mt-1 text-sm text-muted">
              {taperStats.count} trades · {fmtPct(taperStats.winRate)} win rate
            </p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="text-base font-medium">🐒 Monkey, In Balance</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              <PnlText value={monkeyStats.pnl} className="text-2xl" />
            </p>
            <p className="mt-1 text-sm text-muted">
              {monkeyStats.count} trades · {fmtPct(monkeyStats.winRate)} win rate
            </p>
          </div>
        </div>
        {monkeyStats.count > 0 && monkeyStats.pnl < 0 ? (
          <p className="mt-4 rounded-xl bg-warn-soft px-3.5 py-2.5 text-base text-warn">
            Monkey tax so far is {fmtMoney(Math.abs(monkeyStats.pnl))}. That&apos;s what
            trading the middle has cost you.
          </p>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Process Vs Outcome</SectionTitle>
        <div className="divide-y divide-line/60">
          {byGrade.map(({ grade, stats }) => (
            <div key={grade} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base font-semibold">{grade} Execution</span>
                <PnlText value={stats.pnl} className="shrink-0" />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {stats.count} trade{stats.count === 1 ? "" : "s"} · {fmtPct(stats.winRate)} win rate
              </p>
              <div className="mt-2 h-4 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (Math.abs(stats.pnl) / maxGradePnl) * 100)}%`,
                    backgroundColor: stats.pnl >= 0 ? "var(--chart-up)" : "var(--chart-down)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <BreakdownCard title="Emotion At Entry" rows={byEmotion} />
      <BreakdownCard title="Edge Or Prediction?" rows={byEdgeType} />
      <BreakdownCard title="Risk Acceptance Vs PnL" rows={byRiskAcceptance} />
      <BreakdownCard title="Execution Timing Vs PnL" rows={byTiming} />
      <BreakdownCard title="Management Mistakes Vs PnL" rows={byMistake} />

      {viols.length > 0 ? (
        <Card>
          <SectionTitle>Violation Log</SectionTitle>
          <div className="space-y-2.5">
            {viols.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="block rounded-xl border border-line px-4 py-3 transition-colors hover:bg-surface-2"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2.5">
                    <span className="shrink-0 text-sm text-muted">{fmtDateShort(t.tradeDate)}</span>
                    <span className="text-base font-bold">{t.instrument}</span>
                  </span>
                  <PnlText value={t.pnl} className="shrink-0" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {t.noLabel ? <Badge tone="warn">No Label</Badge> : null}
                  {t.followedRules === false ? <Badge tone="down">Broke Rules</Badge> : null}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

/** One row pattern for every breakdown. Label left, PnL right, meta below. Nothing wraps. */
function StatRow({
  label,
  stats,
  extra,
  labelClassName,
}: {
  label: string;
  stats: SetupStats;
  extra?: string;
  labelClassName?: string;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`min-w-0 flex-1 truncate text-base font-medium ${labelClassName ?? ""}`}>
          {label}
        </span>
        <PnlText value={stats.pnl} className="shrink-0" />
      </div>
      <p className="mt-0.5 text-sm text-muted">
        {stats.count} trade{stats.count === 1 ? "" : "s"} · {fmtPct(stats.winRate)} win rate
        {extra ? ` · ${extra}` : ""}
      </p>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; stats: SetupStats }[];
}) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <div className="divide-y divide-line/60">
        {rows.map((r) => (
          <StatRow key={r.label} label={r.label} stats={r.stats} />
        ))}
      </div>
    </Card>
  );
}

function PerfStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div>
      <dt className="text-base text-muted">{label}</dt>
      <dd
        className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
