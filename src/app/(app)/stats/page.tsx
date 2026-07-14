import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups, trades } from "@/db/schema";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { PnlText } from "@/components/badges";
import { fmtDateShort, fmtMoney, fmtPct, fmtR } from "@/lib/format";
import { statsForTrades, violations } from "@/lib/stats";
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
        <Card className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight">Stats</h1>
        </Card>
        <EmptyState title="No data yet." hint="Stats appear once you log recaps." />
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

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <h1 className="text-2xl font-semibold tracking-tight">Stats</h1>
      </Card>

      <Card>
        <SectionTitle hint="Your edge, setup by setup. This is the distribution Douglas says to trust.">
          Edge By Setup
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
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
        <SectionTitle hint="What trading inside balance actually costs you.">
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
        <SectionTitle hint="If A-trades make money and F-trades lose it, the problem was never the market.">
          Process Vs Outcome
        </SectionTitle>
        <div className="space-y-2">
          {byGrade.map(({ grade, trades: gts }) => (
            <div key={grade} className="flex items-center gap-3 text-sm">
              <span className="w-8 font-semibold">{grade}</span>
              <span className="w-16 text-muted">{gts.length} trade{gts.length === 1 ? "" : "s"}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
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
          <SectionTitle hint="Emotion before entry vs how those trades went.">
            Emotion At Entry
          </SectionTitle>
          <div className="space-y-2">
            {byEmotion.map(({ emotion, trades: ets }) => (
              <div key={emotion} className="flex items-center gap-3 text-sm">
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
          <SectionTitle hint="Douglas says an edge is a higher probability, not a prediction. Where does your money actually come from?">
            Edge Or Prediction?
          </SectionTitle>
          <div className="space-y-2">
            {byEdgeType.map(({ label, value, trades: ets }) => (
              <div key={value} className="flex items-center gap-3 text-sm">
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
          <SectionTitle hint="When you accept risk, your decisions improve. When you resist it, you sabotage. Here's the proof.">
            Risk Acceptance Vs PnL
          </SectionTitle>
          <div className="space-y-2">
            {byRiskAcceptance.map(({ answer, trades: rts }) => (
              <div key={answer} className="flex items-center gap-3 text-sm">
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
          <SectionTitle hint="For DOM trading, most damage comes from being early, late, or chasing.">
            Execution Timing Vs PnL
          </SectionTitle>
          <div className="space-y-2">
            {byTiming.map(({ timing, trades: tts }) => (
              <div key={timing} className="flex items-center gap-3 text-sm">
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
          <SectionTitle hint="What each management mistake has cost you.">
            Management Mistakes Vs PnL
          </SectionTitle>
          <div className="space-y-2">
            {byMistake.map(({ mistake, trades: mts }) => (
              <div key={mistake} className="flex items-center gap-3 text-sm">
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
          <SectionTitle hint="Unlabeled trades and broken rules. Read these before your next session.">
            Violation Log
          </SectionTitle>
          <div className="space-y-2">
            {viols.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm hover:bg-surface-2"
              >
                <span className="w-14 text-xs text-muted">{fmtDateShort(t.tradeDate)}</span>
                <span className="w-12 font-medium">{t.instrument}</span>
                <span className="flex-1">
                  {t.noLabel ? <Badge tone="warn">No label</Badge> : null}{" "}
                  {t.followedRules === false ? <Badge tone="down">Broke rules</Badge> : null}
                </span>
                <PnlText value={t.pnl} />
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
