"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { journalEntries } from "@/db/schema";

export async function saveJournalEntry(formData: FormData) {
  const entryDate = String(formData.get("entryDate") ?? "").trim();
  if (!entryDate) return;

  const values = {
    entryDate,
    premarketPlan: String(formData.get("premarketPlan") ?? "").trim(),
    marketContext: String(formData.get("marketContext") ?? "").trim(),
    mindset: String(formData.get("mindset") ?? "").trim(),
    review: String(formData.get("review") ?? "").trim(),
    dayGrade: String(formData.get("dayGrade") ?? "").trim() || null,
  };

  const db = await getDb();
  const [existing] = await db
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(eq(journalEntries.entryDate, entryDate));

  if (existing) {
    await db.update(journalEntries).set(values).where(eq(journalEntries.id, existing.id));
  } else {
    await db.insert(journalEntries).values(values);
  }
  revalidatePath("/journal");
}

export async function deleteJournalEntry(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const db = await getDb();
  await db.delete(journalEntries).where(eq(journalEntries.id, id));
  revalidatePath("/journal");
}
