import { NextRequest, NextResponse } from "next/server";
import { saveEvidenceNotebook } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ ok: false, message: "Sign in before saving evidence." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON request." }, { status: 400 });
  }

  if (!isEvidenceRequest(body)) {
    return NextResponse.json({ ok: false, message: "Evidence fields are required." }, { status: 400 });
  }

  const progress = await saveEvidenceNotebook({
    sessionId,
    ...body,
  });

  if (!progress) {
    return NextResponse.json({ ok: false, message: "Session expired. Please sign in again." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, progress });
}

function isEvidenceRequest(value: unknown): value is {
  challengeId: string;
  normalRequest: string;
  modifiedRequest: string;
  vulnerableResponse: string;
  secureResponse: string;
  traceProof: string;
  impactSummary: string;
  rootCause: string;
  fixRecommendation: string;
} {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return [
    "challengeId",
    "normalRequest",
    "modifiedRequest",
    "vulnerableResponse",
    "secureResponse",
    "traceProof",
    "impactSummary",
    "rootCause",
    "fixRecommendation",
  ].every((field) => typeof candidate[field] === "string");
}
