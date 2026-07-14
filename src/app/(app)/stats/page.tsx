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

  const byGrade = GRADES.map((g) => ({
    grade: g,
    trades: all.filter((t) => t.executionGrade === g),
  })).filter((r) => r.trades.length > 0);

  const byEmotion = EMOTIONS.map((e) => ({
    emotion: e,
    trades: all.filter((t) => t.emotionBefore === e),
  })).filter((r) => r.trades.length > 0);

  const byEdgeType = EDGE_TYPES.map((e) => ({
    label: e.label.split(",")[0],
    value: e.value,
    trades: all.filter((t) => t.edgeType === e.value),
  })).filter((r) => r.trades.length > 0);

  const byRiskAcceptance = RISK_ACCEPTANCE_AFTER_ENTRY.map((r) => ({
    answer: r,
    trades: all.filter((t) => t.riskAcceptanceAfterEntry === r),
  })).filter((r) => r.trades.length > 0);

  const byTiming = EXECUTION_TIMINGS.map((tm) => ({
    timing: tm,
    trades: all.filter((t) => t.executionTiming === tm),
  })).filter((r) => r.trades.length > 0);

  const byMistake = MANAGEMENT_MISTAKES.filter((m) => m !== "None")
    .map((m) => ({
      mistake: m,
      trades: all.filter((t) => t.managementMistake === m),
    }))
    .filter((r) => r.trades.length > 0);

  const pf = profitFactor(all);
  const dd = maxDrawdown(all);
  const { avgWin, avgLoss } = avgWinLoss(all);
  const overall = statsForTrades(all);

  const byWeekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    .map((d) => ({ day: d, trades: all.filter((t) => weekdayOf(t.tradeDate) === d) }))
    .filter((r) => r.trades.length > 0);

  const bySession = SESSION_BUCKETS.map((b) => ({
    bucket: b as string,
    trades: all.filter((t) => sessionBucket(t.entryTime) === b),
  })).filter((r) => r.trades.length > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <SectionTitle>
          Performance
        </SectionTitle>
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

      {byWeekday.length > 0 ? (
        <Card>
          <SectionTitle>
            Day Of Week
          </SectionTitle>
          <div className="space-y-2">
            {byWeekday.map(({ day, trades: dts }) => (
              <div key={day} className="flex items-center gap-3 text-base">
                <span className="w-28">{day}</span>
                <span className="w-16 text-muted">{dts.length} trade{dts.length === 1 ? "" : "s"}</span>
                <span className="w-14 text-right tabular-nums text-muted">
                  {fmtPct(statsForTrades(dts).winRate)}
                </span>
                <PnlText value={statsForTrades(dts).pnl} className="flex-1 text-right" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {bySession.length > 0 ? (
        <Card>
          <SectionTitle>
            Time Of Day
          </SectionTitle>
          <div className="space-y-2">
            {bySession.map(({ bucket, trades: bts }) => (
              <div key={bucket} className="flex items-center gap-3 text-base">
                <span className="w-28">{bucket}</span>
                <span className="w-16 text-muted">{bts.length} trade{bts.length === 1 ? "" : "s"}</span>
                <span className="w-14 text-right tabular-nums text-muted">
                  {fmtPct(statsForTrades(bts).winRate)}
                </span>
                <PnlText value={statsForTrades(bts).pnl} className="flex-1 text-right" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <SectionTitle>
          Edge By Setup
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-base">
            <thead>
              <tr className="border-b border-line text-left text-sm text-muted">
                <th className="py-2 pr-3 font-medium">Setup</th>
                <th className="py-2 pr-3 text-right font-medium">Trades</th>
                <th className="py-2 pr-3 text-right font-medium">Win Rate</th>
                <th className="py-2 pr-3 text-right font-medium">Avg R</th>
                <th className="py-2 pr-3 text-right font-medium">Expectancy</th>
                <th className="py-2 text-right font-medium">PnL</th>
              </tr>
            </thead>
            <tbody>
              {bySetup.map(({ setup, stats }) => (
                <tr key={setup.id} className="border-b border-line/60">
                  <td className="py-2.5 pr-3 font-medium">{setup.name}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{stats.count}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{fmtPct(stats.winRate)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{fmtR(stats.avgR)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {stats.expectancy != null ? fmtMoney(stats.expectancy) : "-"}
                  </td>
                  <td className="py-2.5 text-right">
                    <PnlText value={stats.pnl} />
                  </td>
                </tr>
              ))}
              {noLabelTrades.length > 0 ? (
                <tr>
                  <td className="py-2.5 pr-3 text-warn">Unlabeled (violations)</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{noLabelTrades.length}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {fmtPct(statsForTrades(noLabelTrades).winRate)}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {fmtR(statsForTrades(noLabelTrades).avgR)}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {fmtMoney(statsForTrades(noLabelTrades).expectancy ?? 0)}
                  </td>
                  <td className="py-2.5 text-right">
                    <PnlText value={statsForTrades(noLabelTrades).pnl} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle>
          Taper Vs Monkey
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="text-sm font-medium">Taper, Edge Or Excess</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              <PnlText value={taperStats.pnl} />
            </p>
            <p className="mt-1 text-sm text-muted">
              {taperStats.count} trades · {fmtPct(taperStats.winRate)} win rate
            </p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="text-sm font-medium">🐒 Monkey, In Balance</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              <PnlText value={monkeyStats.pnl} />
            </p>
            <p className="mt-1 text-sm text-muted">
              {monkeyStats.count} trades · {fmtPct(monkeyStats.winRate)} win rate
            </p>
          </div>
        </div>
        {monkeyStats.count > 0 && monkeyStats.pnl < 0 ? (
          <p className="mt-3 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
            Monkey tax so far is {fmtMoney(Math.abs(monkeyStats.pnl))}. That&apos;s what
            trading the middle has cost you.
          </p>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>
          Process Vs Outcome
        </SectionTitle>
        <div className="space-y-2">
          {byGrade.map(({ grade, trades: gts }) => (
            <div key={grade} className="flex items-center gap-3 text-base">
              <span className="w-8 font-semibold">{grade}</span>
              <span className="w-16 text-muted">{gts.length} trade{gts.length === 1 ? "" : "s"}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (Math.abs(statsForTrades(gts).pnl) / Math.max(1, ...byGrade.map((b) => Math.abs(statsForTrades(b.trades).pnl)))) * 100)}%`,
                    backgroundColor:
                      statsForTrades(gts).pnl >= 0 ? "var(--chart-up)" : "var(--chart-down)",
                  }}
                />
              </div>
              <PnlText value={statsForTrades(gts).pnl} className="w-24 text-right" />
            </div>
          ))}
        </div>
      </Card>

      {byEmotion.length > 0 ? (
        <Card>
          <SectionTitle>
            Emotion At Entry
          </SectionTitle>
          <div className="space-y-2">
            {byEmotion.map(({ emotion, trades: ets }) => (
              <div key={emotion} className="flex items-center gap-3 text-base">
                <span className="w-28">{emotion}</span>
                <span className="w-16 text-muted">{ets.length} trade{ets.length === 1 ? "" : "s"}</span>
                <span className="w-14 text-right tabular-nums text-muted">
                  {fmtPct(statsForTrades(ets).winRate)}
                </span>
                <PnlText value={statsForTrades(ets).pnl} className="flex-1 text-right" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {byEdgeType.length > 0 ? (
        <Card>
          <SectionTitle>
            Edge Or Prediction?
          </SectionTitle>
          <div className="space-y-2">
            {byEdgeType.map(({ label, value, trades: ets }) => (
              <div key={value} className="flex items-center gap-3 text-base">
                <span className="w-28 font-medium">{label}</span>
                <span className="w-16 text-muted">{ets.length} trade{ets.length === 1 ? "" : "s"}</span>
                <span className="w-14 text-right tabular-nums text-muted">
                  {fmtPct(statsForTrades(ets).winRate)}
                </span>
                <PnlText value={statsForTrades(ets).pnl} className="flex-1 text-right" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {byRiskAcceptance.length > 0 ? (
        <Card>
          <SectionTitle>
            Risk Acceptance Vs PnL
          </SectionTitle>
          <div className="space-y-2">
            {byRiskAcceptance.map(({ answer, trades: rts }) => (
              <div key={answer} className="flex items-center gap-3 text-base">
                <span className="w-40 truncate" title={answer}>{answer}</span>
                <span className="w-16 text-muted">{rts.length} trade{rts.length === 1 ? "" : "s"}</span>
                <span className="w-14 text-right tabular-nums text-muted">
                  {fmtPct(statsForTrades(rts).winRate)}
                </span>
                <PnlText value={statsForTrades(rts).pnl} className="flex-1 text-right" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {byTiming.length > 0 ? (
        <Card>
          <SectionTitle>
            Execution Timing Vs PnL
          </SectionTitle>
          <div className="space-y-2">
            {byTiming.map(({ timing, trades: tts }) => (
              <div key={timing} className="flex items-center gap-3 text-base">
                <span className="w-40 truncate" title={timing}>{timing}</span>
                <span className="w-16 text-muted">{tts.length} trade{tts.length === 1 ? "" : "s"}</span>
                <span className="w-14 text-right tabular-nums text-muted">
                  {fmtPct(statsForTrades(tts).winRate)}
                </span>
                <PnlText value={statsForTrades(tts).pnl} className="flex-1 text-right" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {byMistake.length > 0 ? (
        <Card>
          <SectionTitle>
            Management Mistakes Vs PnL
          </SectionTitle>
          <div className="space-y-2">
            {byMistake.map(({ mistake, trades: mts }) => (
              <div key={mistake} className="flex items-center gap-3 text-base">
                <span className="w-40 truncate" title={mistake}>{mistake}</span>
                <span className="w-16 text-muted">{mts.length} trade{mts.length === 1 ? "" : "s"}</span>
                <span className="w-14 text-right tabular-nums text-muted">
                  {fmtPct(statsForTrades(mts).winRate)}
                </span>
                <PnlText value={statsForTrades(mts).pnl} className="flex-1 text-right" />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {viols.length > 0 ? (
        <Card>
          <SectionTitle>
            Violation Log
          </SectionTitle>
          <div className="space-y-2">
            {viols.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line px-3.5 py-2.5 text-base hover:bg-surface-2"
              >
                <span className="w-16 text-sm text-muted">{fmtDateShort(t.tradeDate)}</span>
                <span className="w-12 font-medium">{t.instrument}</span>
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {t.noLabel ? <Badge tone="warn">No Label</Badge> : null}
                  {t.followedRules === false ? <Badge tone="down">Broke Rules</Badge> : null}
                </span>
                <PnlText value={t.pnl} className="ml-auto" />
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
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
