import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  loggedIn?: boolean;
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

export function appPassword() {
  return process.env.APP_PASSWORD ?? "trade";
}
