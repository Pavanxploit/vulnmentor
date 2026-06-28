import { NextRequest, NextResponse } from "next/server";
import { createStudentSession } from "@/lib/progress-store";
import { sessionCookieName } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
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
      { ok: false, message: "Student name is required." },
      { status: 400 },
    );
  }

  const result = await createStudentSession(body);
  const response = NextResponse.json({
    ok: true,
    student: result.student,
    progress: result.progress,
  });

  response.cookies.set(sessionCookieName, result.student.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}

function isLoginRequest(value: unknown): value is { name: string; usn?: string } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    (candidate.usn === undefined || typeof candidate.usn === "string")
  );
}
