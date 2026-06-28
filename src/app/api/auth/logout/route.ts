import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/progress-store";
import { getSessionId, sessionCookieName } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
  await destroySession(getSessionId(request));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
