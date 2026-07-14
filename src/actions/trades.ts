"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { trades, screenshots, setups } from "@/db/schema";
import { saveFile, deleteFile } from "@/lib/storage";
import { requireUserId } from "@/lib/session";

export type TradeActionResult = { error: string } | undefined;

function num(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function bool(formData: FormData, key: string): boolean | null {
  const raw = str(formData, key);
  if (raw === "yes") return true;
  if (raw === "no") return false;
  return null;
}

type ScreenshotMeta = { chartType: string; caption: string; evidenceTag?: string };
type ExistingMeta = { id: number; chartType: string; caption: string; evidenceTag?: string };

export async function saveTrade(formData: FormData): Promise<TradeActionResult> {
  const userId = await requireUserId();
  const id = num(formData, "id");
  const tradeDate = str(formData, "tradeDate");
  const instrument = str(formData, "instrument");
  const direction = str(formData, "direction");
  const label = str(formData, "label"); // "setup:<id>" | "nolabel" | ""

  if (!tradeDate) return { error: "Trade date is required." };
  if (!instrument) return { error: "Instrument is required." };
  if (direction !== "long" && direction !== "short")
    return { error: "Pick a direction." };
  if (!label)
    return {
      error:
        "The Label Rule says to name the setup you traded, or own it and pick “I couldn't name it.”",
    };

  const noLabel = label === "nolabel";
  const setupId = noLabel ? null : Number(label.replace("setup:", "")) || null;
  if (!noLabel && !setupId) return { error: "Pick a setup from your playbook." };

  const db = await getDb();
  if (setupId) {
    const [ownSetup] = await db
      .select({ id: setups.id })
      .from(setups)
      .where(and(eq(setups.id, setupId), eq(setups.userId, userId)));
    if (!ownSetup) return { error: "Pick a setup from your playbook." };
  }

  const entryPrice = num(formData, "entryPrice");
  const exitPrice = num(formData, "exitPrice");
  const stopPrice = num(formData, "stopPrice");
  let realizedR = num(formData, "realizedR");

  // Auto-derive realized R from entry/stop/exit when not given.
  if (realizedR == null && entryPrice != null && exitPrice != null && stopPrice != null) {
    const risk = Math.abs(entryPrice - stopPrice);
    if (risk > 0) {
      const move = direction === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;
      realizedR = Math.round((move / risk) * 100) / 100;
    }
  }

  const values = {
    userId,
    tradeDate,
    entryTime: str(formData, "entryTime") || null,
    instrument,
    direction,
    contracts: num(formData, "contracts"),
    entryPrice,
    exitPrice,
    stopPrice,
    targetPrice: num(formData, "targetPrice"),
    pnl: num(formData, "pnl") ?? 0,
    pnlPoints: num(formData, "pnlPoints"),
    plannedR: num(formData, "plannedR"),
    realizedR,
    setupId,
    noLabel,
    location: str(formData, "location") || "unsure",
    emotionBefore: str(formData, "emotionBefore") || null,
    emotionDuring: str(formData, "emotionDuring") || null,
    emotionAfter: str(formData, "emotionAfter") || null,
    conviction: num(formData, "conviction"),
    followedRules: bool(formData, "followedRules"),
    acceptedRisk: bool(formData, "acceptedRisk"),
    executionGrade: str(formData, "executionGrade") || null,
    executionTiming: str(formData, "executionTiming") || null,
    riskAcceptanceAfterEntry: str(formData, "riskAcceptanceAfterEntry") || null,
    managementMistake: str(formData, "managementMistake") || null,
    edgeType: str(formData, "edgeType") || null,
    narrative: str(formData, "narrative"),
    whatWentWell: str(formData, "whatWentWell"),
    whatToImprove: str(formData, "whatToImprove"),
    youtubeUrl: str(formData, "youtubeUrl") || null,
    updatedAt: new Date(),
  };

  let tradeId: number;

  try {
  if (id) {
    const [own] = await db
      .select({ id: trades.id })
      .from(trades)
      .where(and(eq(trades.id, id), eq(trades.userId, userId)));
    if (!own) return { error: "That trade is not in your journal." };
    await db.update(trades).set(values).where(eq(trades.id, id));
    tradeId = id;

    // Update kept screenshots' tags/captions, remove deleted ones.
    const existing: ExistingMeta[] = JSON.parse(str(formData, "existingScreenshots") || "[]");
    for (const s of existing) {
      await db
        .update(screenshots)
        .set({ chartType: s.chartType, caption: s.caption, evidenceTag: s.evidenceTag || null })
        .where(and(eq(screenshots.id, s.id), eq(screenshots.tradeId, tradeId)));
    }
    const deletedIds: number[] = JSON.parse(str(formData, "deletedScreenshotIds") || "[]");
    for (const sid of deletedIds) {
      const [row] = await db
        .select()
        .from(screenshots)
        .where(and(eq(screenshots.id, sid), eq(screenshots.tradeId, tradeId)));
      if (row) {
        await deleteFile(row.url);
        await db.delete(screenshots).where(eq(screenshots.id, sid));
      }
    }
  } else {
    const [inserted] = await db.insert(trades).values(values).returning({ id: trades.id });
    tradeId = inserted.id;
  }

  // New screenshot uploads (aligned with metadata by index).
  const files = formData.getAll("screenshotFiles").filter((f): f is File => f instanceof File && f.size > 0);
  const metas: ScreenshotMeta[] = JSON.parse(str(formData, "screenshotMeta") || "[]");
  for (let i = 0; i < files.length; i++) {
    const url = await saveFile(files[i]);
    await db.insert(screenshots).values({
      tradeId,
      url,
      chartType: metas[i]?.chartType ?? "Other",
      caption: metas[i]?.caption ?? "",
      evidenceTag: metas[i]?.evidenceTag || null,
      sortOrder: i,
    });
  }

  } catch (e) {
    // Surface the real database or storage failure in the form instead of a blank error page.
    return { error: `Could not save. ${e instanceof Error ? e.message : "Unknown error."}` };
  }

  revalidatePath("/");
  revalidatePath("/trades");
  revalidatePath("/stats");
  redirect(`/trades/${tradeId}`);
}

export async function deleteTrade(formData: FormData) {
  const userId = await requireUserId();
  const id = Number(formData.get("id"));
  if (!id) return;
  const db = await getDb();
  const [own] = await db
    .select({ id: trades.id })
    .from(trades)
    .where(and(eq(trades.id, id), eq(trades.userId, userId)));
  if (!own) return;
  const shots = await db.select().from(screenshots).where(eq(screenshots.tradeId, id));
  for (const s of shots) {
    await deleteFile(s.url);
  }
  await db.delete(trades).where(eq(trades.id, id));
  revalidatePath("/");
  revalidatePath("/trades");
  redirect("/trades");
}
