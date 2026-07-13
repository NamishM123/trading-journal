"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { setups } from "@/db/schema";

export async function createSetup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const db = await getDb();
  await db.insert(setups).values({
    name,
    description: String(formData.get("description") ?? "").trim(),
    rules: String(formData.get("rules") ?? "").trim(),
  });
  revalidatePath("/playbook");
}

export async function updateSetup(formData: FormData) {
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
    .where(eq(setups.id, id));
  revalidatePath("/playbook");
}

export async function toggleSetupActive(formData: FormData) {
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;
  const db = await getDb();
  await db.update(setups).set({ isActive: active }).where(eq(setups.id, id));
  revalidatePath("/playbook");
}
