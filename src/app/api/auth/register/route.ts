import { NextRequest, NextResponse } from "next/server";
import { registerAccount } from "@/lib/progress-store";
import { sessionCookieName } from "@/lib/session-cookie";
import { rejectUntrustedOrigin } from "@/lib/request-origin";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponseHeaders,
  registerRateLimit,
} from "@/lib/rate-limit";
import type { UserRole } from "@/lib/progress-types";

export async function POST(request: NextRequest) {
  const untrustedOrigin = rejectUntrustedOrigin(request);
  if (untrustedOrigin) return untrustedOrigin;

  // Registration runs scrypt before touching the database, so an unbounded
  // caller could pin the CPU without ever creating an account.
  const limit = checkRateLimit(`register:${getClientKey(request)}`, registerRateLimit);

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many accounts created recently. Wait a moment and try again." },
      { status: 429, headers: rateLimitResponseHeaders(limit) },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON request." },
      { status: 400 },
    );
  }

  if (!isRegisterRequest(body)) {
    return NextResponse.json(
      { ok: false, message: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  let result: Awaited<ReturnType<typeof registerAccount>>;

  try {
    result = await registerAccount(body);
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not create account." },
      { status: 400 },
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

function isRegisterRequest(value: unknown): value is {
  name: string;
  email: string;
  password: string;
  usn?: string;
  role?: UserRole;
  instructorCode?: string;
} {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.email === "string" &&
    candidate.email.trim().length > 0 &&
    typeof candidate.password === "string" &&
    candidate.password.length > 0 &&
    (candidate.usn === undefined || typeof candidate.usn === "string") &&
    (candidate.role === undefined || candidate.role === "student" || candidate.role === "instructor") &&
    (candidate.instructorCode === undefined || typeof candidate.instructorCode === "string")
  );
}
