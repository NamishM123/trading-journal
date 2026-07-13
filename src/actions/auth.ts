"use server";

import { redirect } from "next/navigation";
import { getSession, appPassword } from "@/lib/session";

export async function login(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const password = String(formData.get("password") ?? "");
  if (password !== appPassword()) {
    return { error: "Wrong password." };
  }
  const session = await getSession();
  session.loggedIn = true;
  await session.save();
  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
