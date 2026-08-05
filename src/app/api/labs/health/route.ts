import { NextRequest, NextResponse } from "next/server";
import { getLabHealth } from "@/lib/lab-health";
import { getStudentSession } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";

/**
 * Lab status for the dashboard, lab pages, and Guide Console.
 *
 * The snapshot is cached server-side, so polling this endpoint costs far less
 * than every browser probing every lab directly.
 */
export async function GET(request: NextRequest) {
  const session = await getStudentSession(getSessionId(request));

  if (!session) {
    return NextResponse.json({ ok: false, message: "Sign in to view lab status." }, { status: 401 });
  }

  const health = await getLabHealth();

  return NextResponse.json(
    { ok: true, health },
    { headers: { "cache-control": "no-store" } },
  );
}
