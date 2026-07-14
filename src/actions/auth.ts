"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, setups } from "@/db/schema";
import { getSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { DEFAULT_SETUPS } from "@/lib/constants";

type AuthResult = { error: string } | null;

function cleanUsername(raw: FormDataEntryValue | null): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

export async function login(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const username = cleanUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Wrong username or password." };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();
  redirect("/");
}

export async function signup(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const username = cleanUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return {
      error: "Usernames are 3 to 20 characters, letters and numbers and underscores only.",
    };
  }
  if (password.length < 4) {
    return { error: "Passwords need at least 4 characters." };
  }

  const db = await getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username));
  if (existing) return { error: "That username is taken. Pick another or log in." };

  const [user] = await db
    .insert(users)
    .values({ username, passwordHash: hashPassword(password) })
    .returning({ id: users.id });

  // Every new account starts with the default orderflow playbook.
  await db.insert(setups).values(
    DEFAULT_SETUPS.map((s, i) => ({
      userId: user.id,
      name: s.name,
      description: s.description,
      sortOrder: i,
    }))
  );

  const session = await getSession();
  session.userId = user.id;
  session.username = username;
  await session.save();
  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
