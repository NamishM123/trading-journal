import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SessionData = {
  userId?: number;
  username?: string;
};

export const sessionOptions: SessionOptions = {
  cookieName: "tj_session",
  password:
    process.env.SESSION_SECRET ??
    "dev-only-session-secret-change-me-in-production!!",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/** The logged-in user's id, or a redirect to /login. Call at the top of pages and actions. */
export async function requireUserId(): Promise<number> {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  return session.userId;
}
