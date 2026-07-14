import type { TradeWithRelations } from "@/db/schema";

const GRADE_POINTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
const POINT_GRADES = ["F", "D", "C", "B", "A"];

export function winRate(trades: { pnl: number }[]): number | null {
  if (trades.length === 0) return null;
  return trades.filter((t) => t.pnl > 0).length / trades.length;
}

export function totalPnl(trades: { pnl: number }[]): number {
  return trades.reduce((s, t) => s + t.pnl, 0);
}

export function avgR(trades: { realizedR: number | null }[]): number | null {
  const rs = trades.map((t) => t.realizedR).filter((r): r is number => r != null);
  if (rs.length === 0) return null;
  return rs.reduce((s, r) => s + r, 0) / rs.length;
}

export function avgGrade(trades: { executionGrade: string | null }[]): string | null {
  const gs = trades
    .map((t) => t.executionGrade)
    .filter((g): g is string => g != null && g in GRADE_POINTS);
  if (gs.length === 0) return null;
  const avg = gs.reduce((s, g) => s + GRADE_POINTS[g], 0) / gs.length;
  return POINT_GRADES[Math.round(avg)];
}

export function expectancy(trades: { pnl: number }[]): number | null {
  if (trades.length === 0) return null;
  return totalPnl(trades) / trades.length;
}

export function monkeyRate(trades: { location: string }[]): number | null {
  const known = trades.filter((t) => t.location !== "unsure");
  if (known.length === 0) return null;
  return known.filter((t) => t.location === "monkey").length / known.length;
}

/** Total PnL given away on trades taken inside balance ("the monkey tax"). */
export function monkeyTax(trades: { pnl: number; location: string }[]): number {
  return totalPnl(trades.filter((t) => t.location === "monkey"));
}

/** Current streak of consecutive most-recent trades where rules were followed. */
export function ruleStreak(trades: { followedRules: boolean | null }[]): number {
  // trades assumed sorted newest-first
  let streak = 0;
  for (const t of trades) {
    if (t.followedRules === false) break;
    if (t.followedRules === true) streak++;
  }
  return streak;
}

export function violations(trades: TradeWithRelations[]): TradeWithRelations[] {
  return trades.filter((t) => t.noLabel || t.followedRules === false);
}

export type SetupStats = {
  count: number;
  wins: number;
  winRate: number | null;
  pnl: number;
  avgR: number | null;
  expectancy: number | null;
  avgGrade: string | null;
};

export function statsForTrades(trades: TradeWithRelations[]): SetupStats {
  return {
    count: trades.length,
    wins: trades.filter((t) => t.pnl > 0).length,
    winRate: winRate(trades),
    pnl: totalPnl(trades),
    avgR: avgR(trades),
    expectancy: expectancy(trades),
    avgGrade: avgGrade(trades),
  };
}

/** Cumulative PnL series in chronological order. */
export function equitySeries(
  trades: { pnl: number; tradeDate: string; id: number }[]
): { x: number; y: number }[] {
  const sorted = [...trades].sort(
    (a, b) => a.tradeDate.localeCompare(b.tradeDate) || a.id - b.id
  );
  let cum = 0;
  return sorted.map((t, i) => {
    cum += t.pnl;
    return { x: i + 1, y: cum };
  });
}

export function dailyPnl(trades: { pnl: number; tradeDate: string }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) {
    map.set(t.tradeDate, (map.get(t.tradeDate) ?? 0) + t.pnl);
  }
  return map;
}

/* ── Discipline Score ─ 0 to 100, graded on process, not PnL. */

export type DisciplineComponent = {
  label: string;
  value: number | null; // 0..1, null when there is no data yet
  weight: number;
};

export function disciplineScore(trades: TradeWithRelations[]): {
  score: number | null;
  band: string;
  components: DisciplineComponent[];
} {
  const rate = (num: number, den: number) => (den > 0 ? num / den : null);

  const rulesAnswered = trades.filter((t) => t.followedRules != null);
  const riskAnswered = trades.filter((t) => t.acceptedRisk != null);
  const located = trades.filter((t) => t.location === "taper" || t.location === "monkey");
  const graded = trades.filter((t) => t.executionGrade && t.executionGrade in GRADE_POINTS);
  const managed = trades.filter((t) => t.managementMistake != null);

  const components: DisciplineComponent[] = [
    {
      label: "Followed Rules",
      value: rate(rulesAnswered.filter((t) => t.followedRules).length, rulesAnswered.length),
      weight: 25,
    },
    {
      label: "Traded The Edge",
      value: rate(located.filter((t) => t.location === "taper").length, located.length),
      weight: 20,
    },
    {
      label: "Named The Setup",
      value: rate(trades.filter((t) => !t.noLabel).length, trades.length),
      weight: 15,
    },
    {
      label: "Accepted The Risk",
      value: rate(riskAnswered.filter((t) => t.acceptedRisk).length, riskAnswered.length),
      weight: 15,
    },
    {
      label: "Execution Quality",
      value:
        graded.length > 0
          ? graded.reduce((s, t) => s + GRADE_POINTS[t.executionGrade!], 0) / (graded.length * 4)
          : null,
      weight: 15,
    },
    {
      label: "Clean Management",
      value: rate(managed.filter((t) => t.managementMistake === "None").length, managed.length),
      weight: 10,
    },
  ];

  const scored = components.filter((c) => c.value != null);
  const totalWeight = scored.reduce((s, c) => s + c.weight, 0);
  const score =
    totalWeight > 0
      ? Math.round((scored.reduce((s, c) => s + c.value! * c.weight, 0) / totalWeight) * 100)
      : null;

  const band =
    score == null
      ? "No Data Yet"
      : score >= 85
        ? "Disciplined"
        : score >= 70
          ? "Solid"
          : score >= 50
            ? "Slipping"
            : "Full Monkey";

  return { score, band, components };
}

/* ── Performance measures ── */

export function profitFactor(trades: { pnl: number }[]): number | null {
  const grossWin = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  if (grossLoss === 0) return grossWin > 0 ? Infinity : null;
  return grossWin / grossLoss;
}

/** Deepest peak-to-trough drop of the cumulative PnL curve. */
export function maxDrawdown(trades: { pnl: number; tradeDate: string; id: number }[]): number {
  let peak = 0;
  let cum = 0;
  let worst = 0;
  for (const p of equitySeries(trades)) {
    cum = p.y;
    if (cum > peak) peak = cum;
    if (peak - cum > worst) worst = peak - cum;
  }
  return worst;
}

export function avgWinLoss(trades: { pnl: number }[]): { avgWin: number | null; avgLoss: number | null } {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  return {
    avgWin: wins.length ? totalPnl(wins) / wins.length : null,
    avgLoss: losses.length ? totalPnl(losses) / losses.length : null,
  };
}

/* ── Groupings for the time reports ── */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function weekdayOf(tradeDate: string): string {
  return WEEKDAYS[new Date(tradeDate + "T12:00:00").getDay()];
}

export const SESSION_BUCKETS = ["Open Drive", "Late Morning", "Midday", "Afternoon"] as const;

/** Entry-time session bucket. Open Drive runs to 10:30, Late Morning to noon, Midday to 14:00. */
export function sessionBucket(entryTime: string | null): string | null {
  if (!entryTime) return null;
  const [h, m] = entryTime.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  const mins = h * 60 + (m || 0);
  if (mins < 630) return "Open Drive";
  if (mins < 720) return "Late Morning";
  if (mins < 840) return "Midday";
  return "Afternoon";
}
