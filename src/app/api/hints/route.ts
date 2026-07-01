import { NextRequest, NextResponse } from "next/server";
import { recordHintView } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, message: "Sign in before saving hint usage." },
      { status: 401 },
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

  if (!isHintRequest(body)) {
    return NextResponse.json(
      { ok: false, message: "challengeId and hintIndex are required." },
      { status: 400 },
    );
  }

  const progress = await recordHintView({
    sessionId,
    challengeId: body.challengeId,
    hintIndex: body.hintIndex,
  });

  if (!progress) {
    return NextResponse.json(
      { ok: false, message: "Session expired. Please sign in again." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true, progress });
}

function isHintRequest(value: unknown): value is {
  challengeId: string;
  hintIndex: number;
} {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.challengeId === "string" &&
    typeof candidate.hintIndex === "number" &&
    Number.isFinite(candidate.hintIndex)
  );
}
