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
