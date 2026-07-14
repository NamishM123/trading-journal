import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const isLogin = req.nextUrl.pathname.startsWith("/login");

  if (!session.userId && !isLogin) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  if (session.userId && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return res;
}

export const config = {
  // Protect everything (including /api/uploads) except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
