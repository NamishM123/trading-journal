"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups } from "@/db/schema";
import { requireUserId } from "@/lib/session";

export async function createSetup(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const db = await getDb();
  await db.insert(setups).values({
    userId,
    name,
    description: String(formData.get("description") ?? "").trim(),
    rules: String(formData.get("rules") ?? "").trim(),
  });
  revalidatePath("/playbook");
}

export async function updateSetup(formData: FormData) {
  const userId = await requireUserId();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const db = await getDb();
  await db
    .update(setups)
    .set({
      name,
      description: String(formData.get("description") ?? "").trim(),
      rules: String(formData.get("rules") ?? "").trim(),
    })
    .where(and(eq(setups.id, id), eq(setups.userId, userId)));
  revalidatePath("/playbook");
}

export async function toggleSetupActive(formData: FormData) {
  const userId = await requireUserId();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;
  const db = await getDb();
  await db
    .update(setups)
    .set({ isActive: active })
    .where(and(eq(setups.id, id), eq(setups.userId, userId)));
  revalidatePath("/playbook");
}
