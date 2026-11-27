import { NextRequest, NextResponse } from "next/server";
import { joinClassByCode, listClassesForStudent } from "@/lib/store/classes-store";
import { readJsonBody, readString, requireSignedIn } from "@/lib/class-access";
import { checkRateLimit, getClientKey, rateLimitResponseHeaders } from "@/lib/rate-limit";

/**
 * Joining is rate limited because the join code is a short shared secret: an
 * unbounded caller could otherwise walk the code space to enrol in a class
 * they were never given.
 */
const joinRateLimit = { limit: 12, windowMs: 1000 * 60 * 5 };

export async function POST(request: NextRequest) {
  const guard = await requireSignedIn(request, true);
  if (guard.error) return guard.error;

  const limit = checkRateLimit(
    `class-join:${getClientKey(request)}:${guard.session.student.id}`,
    joinRateLimit,
  );

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many join attempts. Wait a moment and try again." },
      { status: 429, headers: rateLimitResponseHeaders(limit) },
    );
  }

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ ok: false, message: "Invalid JSON request." }, { status: 400 });
  }

  const code = readString(body, "joinCode").trim();
  if (!code) {
    return NextResponse.json({ ok: false, message: "Enter a join code." }, { status: 400 });
  }

  const result = await joinClassByCode(guard.session.student.id, code);

  if (!result.ok) {
    // Already-enrolled is a friendly outcome, not a failure: the student ends up
    // exactly where they wanted to be.
    const status = result.reason === "already-enrolled" ? 200 : 404;
    return NextResponse.json(
      {
        ok: false,
        reason: result.reason,
        message: result.message,
        classes: await listClassesForStudent(guard.session.student.id),
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Joined "${result.className}".`,
    classes: await listClassesForStudent(guard.session.student.id),
  });
}
