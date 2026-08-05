import { NextRequest, NextResponse } from "next/server";
import { getLabHealth, restartLabs } from "@/lib/lab-health";
import { getStudentSession } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";
import { rejectUntrustedOrigin } from "@/lib/request-origin";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponseHeaders,
  restartRateLimit,
} from "@/lib/rate-limit";

/**
 * Restarts a Docker lab.
 *
 * Instructor-only by design. Labs are shared: a student restarting one would
 * wipe the traces, comments, and counters that everyone else in the class is
 * mid-way through capturing. Students reset their own work by re-running the
 * lab steps, and the lab page still shows the manual compose command.
 *
 * The service name is validated against the compose services declared in
 * challenges.ts and passed as an argument array, never interpolated into a
 * shell string.
 */
export async function POST(request: NextRequest) {
  const untrustedOrigin = rejectUntrustedOrigin(request);
  if (untrustedOrigin) return untrustedOrigin;

  const session = await getStudentSession(getSessionId(request));

  if (!session || session.student.role !== "instructor") {
    return NextResponse.json(
      { ok: false, message: "Instructor access required to restart labs." },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(`restart:${getClientKey(request)}:${session.student.id}`, restartRateLimit);

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many restarts. Wait for the labs to settle." },
      { status: 429, headers: rateLimitResponseHeaders(limit) },
    );
  }

  let body: unknown = {};

  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON request." }, { status: 400 });
  }

  const requested = body && typeof body === "object"
    ? (body as Record<string, unknown>).serviceName
    : undefined;

  if (requested !== undefined && typeof requested !== "string") {
    return NextResponse.json(
      { ok: false, message: "serviceName must be a string when provided." },
      { status: 400 },
    );
  }

  // Omitting serviceName restarts every lab.
  const outcome = await restartLabs(requested || undefined);

  if (!outcome.ok) {
    return NextResponse.json({ ok: false, message: outcome.message }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: outcome.message,
    restarted: outcome.restarted,
    health: await getLabHealth({ force: true }),
  });
}
