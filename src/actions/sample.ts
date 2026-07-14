"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { trades, setups, journalEntries } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { EMOTIONS, EXECUTION_TIMINGS, MANAGEMENT_MISTAKES } from "@/lib/constants";

// Deterministic PRNG so the sample set is stable and repeatable.
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const NARRATIVES = [
  "Sellers kept reloading the offer at the high of the pullback. Delta stayed negative while price went nowhere, so I leaned short with them.",
  "Buyers got trapped above value on the failed push. Once they started puking I joined the move back into range.",
  "Big passive buyer sat on the bid and absorbed two waves of selling. Third wave failed and we ripped.",
  "Footprint showed heavy imbalance into the level and the DOM flipped right at my price. Clean entry, clean exit.",
  "I saw absorption at the low but hesitated, then chased the second leg. Entry was worse than planned.",
  "Middle of balance, no real edge. I knew it and clicked anyway. Monkey trade, paid the tax.",
];

const WELLS = [
  "Waited for the level and let the trade come to me.",
  "Sized right and accepted the risk before entry.",
  "Took profit at target instead of hoping for more.",
  "Passed on two setups that were not in the playbook.",
];

const IMPROVES = [
  "Stop staring at PnL during the trade.",
  "Take the first exit signal instead of the second.",
  "No trades in the first five minutes.",
  "Write the plan down before the open, not after.",
];

export async function loadSampleData() {
  const userId = await requireUserId();
  const db = await getDb();

  // Idempotent. Double taps and reloads replace the sample set instead of duplicating it.
  await db.delete(trades).where(and(eq(trades.userId, userId), eq(trades.isSample, true)));
  await db
    .delete(journalEntries)
    .where(and(eq(journalEntries.userId, userId), eq(journalEntries.isSample, true)));

  const mySetups = await db
    .select()
    .from(setups)
    .where(and(eq(setups.userId, userId), eq(setups.isActive, true)))
    .orderBy(asc(setups.sortOrder), asc(setups.id));
  if (mySetups.length === 0) return;

  const rnd = mulberry(20260714);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];

  const tradeRows: (typeof trades.$inferInsert)[] = [];
  const day = new Date();
  let placed = 0;
  // Walk back through weekdays until 26 sample trades are placed.
  while (placed < 26) {
    day.setDate(day.getDate() - 1);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue;
    const tradesToday = rnd() < 0.35 ? 2 : 1;

    for (let k = 0; k < tradesToday && placed < 26; k++) {
      const monkey = rnd() < 0.25;
      const noLabel = !monkey && rnd() < 0.12;
      const setup = pick(mySetups);
      const direction = rnd() < 0.55 ? "long" : "short";
      // Tapers win more and win bigger. Monkeys are a coin flip with worse payoff.
      const win = monkey ? rnd() < 0.42 : rnd() < 0.6;
      const risk = 12 + Math.round(rnd() * 10); // ticks of risk in points terms
      const rMult = win
        ? Math.round((0.8 + rnd() * (monkey ? 1.0 : 2.2)) * 100) / 100
        : -Math.round((0.6 + rnd() * 0.5) * 100) / 100;
      const points = Math.round(risk * rMult * 4) / 4;
      const contracts = 1 + Math.floor(rnd() * 3);
      const pnl = Math.round(points * 12.5 * contracts * 4) / 4; // MES-style $12.50 per point
      const entry = 5000 + Math.round(rnd() * 400);
      const grade = monkey
        ? pick(["C", "D", "F", "D"] as const)
        : win
          ? pick(["A", "A", "B", "B", "C"] as const)
          : pick(["A", "B", "B", "C", "D"] as const);

      // Entry times skew toward the open, where most orderflow edge lives.
      const hour = rnd() < 0.5 ? 9 : rnd() < 0.6 ? 10 : rnd() < 0.5 ? 11 : 13 + Math.floor(rnd() * 2);
      const minute = hour === 9 ? 30 + Math.floor(rnd() * 30) : Math.floor(rnd() * 60);

      tradeRows.push({
        userId,
        isSample: true,
        tradeDate: iso(day),
        entryTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        instrument: pick(["ES", "MES", "NQ"] as const),
        direction,
        contracts,
        entryPrice: entry,
        exitPrice: direction === "long" ? entry + points : entry - points,
        stopPrice: direction === "long" ? entry - risk : entry + risk,
        targetPrice: direction === "long" ? entry + risk * 2 : entry - risk * 2,
        pnl,
        pnlPoints: points,
        plannedR: 2,
        realizedR: rMult,
        setupId: noLabel ? null : setup.id,
        noLabel,
        location: monkey ? "monkey" : rnd() < 0.9 ? "taper" : "unsure",
        emotionBefore: pick(EMOTIONS),
        emotionDuring: pick(EMOTIONS),
        emotionAfter: pick(EMOTIONS),
        conviction: 1 + Math.floor(rnd() * 5),
        followedRules: monkey || noLabel ? false : rnd() < 0.85,
        acceptedRisk: rnd() < 0.8,
        executionGrade: grade,
        executionTiming: pick(EXECUTION_TIMINGS),
        riskAcceptanceAfterEntry: pick(["Yes", "Yes", "Yes", "No", "I moved it", "I froze"] as const),
        managementMistake: win ? "None" : pick(MANAGEMENT_MISTAKES),
        edgeType: monkey ? pick(["prediction", "impulse", "revenge"] as const) : "edge",
        narrative: pick(NARRATIVES),
        whatWentWell: pick(WELLS),
        whatToImprove: pick(IMPROVES),
      });
      placed++;
    }
  }
  await db.insert(trades).values(tradeRows);

  // A week and a half of journal entries.
  const jday = new Date();
  let jPlaced = 0;
  while (jPlaced < 8) {
    jday.setDate(jday.getDate() - 1);
    const dow = jday.getDay();
    if (dow === 0 || dow === 6) continue;
    await db
      .insert(journalEntries)
      .values({
        userId,
        isSample: true,
        entryDate: iso(jday),
        premarketPlan: "Overnight balance, value unchanged. Hunting trapped buyers at the high of yesterday and absorption at the low.",
        marketContext: pick(["Balance day, rotational.", "Trend day down after the open drive.", "News at 10, chop until it passed."] as const),
        mindset: pick(["Calm, slept well.", "A little eager after yesterday's winner. Watch it.", "Frustrated from yesterday. Smaller size today."] as const),
        review: pick([
          "Traded the plan. Two setups, took one, passed one correctly.",
          "Chased once in the middle of balance. Paid the monkey tax.",
          "Good patience. The A trade paid for the day.",
        ] as const),
        dayGrade: pick(["A", "B", "B", "C"] as const),
      })
      .onConflictDoNothing();
    jPlaced++;
  }

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/stats");
  revalidatePath("/playbook");
  revalidatePath("/journal");
}

export async function clearSampleData() {
  const userId = await requireUserId();
  const db = await getDb();
  await db.delete(trades).where(and(eq(trades.userId, userId), eq(trades.isSample, true)));
  await db
    .delete(journalEntries)
    .where(and(eq(journalEntries.userId, userId), eq(journalEntries.isSample, true)));
  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/stats");
  revalidatePath("/playbook");
  revalidatePath("/journal");
}
