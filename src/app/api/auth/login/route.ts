import { NextRequest, NextResponse } from "next/server";
import { loginAccount } from "@/lib/progress-store";
import { sessionCookieName } from "@/lib/session-cookie";
import { rejectUntrustedOrigin } from "@/lib/request-origin";
import {
  authRateLimit,
  checkRateLimit,
  getClientKey,
  rateLimitResponseHeaders,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const untrustedOrigin = rejectUntrustedOrigin(request);
  if (untrustedOrigin) return untrustedOrigin;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON request." },
      { status: 400 },
    );
  }

  if (!isLoginRequest(body)) {
    return NextResponse.json(
      { ok: false, message: "Email and password are required." },
      { status: 400 },
    );
  }

  // Keyed on the target account as well as the caller. On a local install every
  // request shares one client key, so limiting by caller alone would let one
  // student's failed logins lock out the whole class.
  const limitKey = `login:${getClientKey(request)}:${body.email.trim().toLowerCase()}`;
  const limit = checkRateLimit(limitKey, authRateLimit);

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many sign-in attempts. Wait a moment and try again." },
      { status: 429, headers: rateLimitResponseHeaders(limit) },
    );
  }

  let result: Awaited<ReturnType<typeof loginAccount>>;

  try {
    result = await loginAccount(body);
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not sign in." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    student: result.student,
    progress: result.progress,
  });

  response.cookies.set(sessionCookieName, result.session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}

function isLoginRequest(value: unknown): value is { email: string; password: string } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.email === "string" &&
    candidate.email.trim().length > 0 &&
    typeof candidate.password === "string" &&
    candidate.password.length > 0
  );
}
