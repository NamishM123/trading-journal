"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { journalEntries } from "@/db/schema";
import { requireUserId } from "@/lib/session";

export type JournalResult = { error?: string; saved?: boolean } | null;

export async function saveJournalEntry(
  _prev: JournalResult,
  formData: FormData
): Promise<JournalResult> {
  const userId = await requireUserId();
  const entryDate = String(formData.get("entryDate") ?? "").trim();
  if (!entryDate) return { error: "Pick a date first." };

  const values = {
    userId,
    entryDate,
    premarketPlan: String(formData.get("premarketPlan") ?? "").trim(),
    marketContext: String(formData.get("marketContext") ?? "").trim(),
    mindset: String(formData.get("mindset") ?? "").trim(),
    review: String(formData.get("review") ?? "").trim(),
    dayGrade: String(formData.get("dayGrade") ?? "").trim() || null,
  };

  try {
    const db = await getDb();
    const [existing] = await db
      .select({ id: journalEntries.id })
      .from(journalEntries)
      .where(and(eq(journalEntries.entryDate, entryDate), eq(journalEntries.userId, userId)));

    if (existing) {
      await db.update(journalEntries).set(values).where(eq(journalEntries.id, existing.id));
    } else {
      await db.insert(journalEntries).values(values);
    }
  } catch (e) {
    return { error: `Could not save. ${e instanceof Error ? e.message : "Unknown error."}` };
  }
  revalidatePath("/journal");
  return { saved: true };
}

export async function deleteJournalEntry(formData: FormData) {
  const userId = await requireUserId();
  const id = Number(formData.get("id"));
  if (!id) return;
  const db = await getDb();
  await db
    .delete(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
  revalidatePath("/journal");
}
