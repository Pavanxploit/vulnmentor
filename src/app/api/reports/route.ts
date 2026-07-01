import { NextRequest, NextResponse } from "next/server";
import { challenges } from "@/data/challenges";
import { getStudentSession, recordGeneratedReport } from "@/lib/progress-store";
import {
  generateReport,
  getReportContentType,
  getReportFileName,
  type ReportFormat,
} from "@/lib/report-generator";
import { getSessionId } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ ok: false, message: "Sign in before generating reports." }, { status: 401 });
  }

  const session = await getStudentSession(sessionId);
  if (!session) {
    return NextResponse.json({ ok: false, message: "Session expired. Please sign in again." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON request." }, { status: 400 });
  }

  if (!isReportRequest(body)) {
    return NextResponse.json({ ok: false, message: "challengeId and format are required." }, { status: 400 });
  }

  const challenge = challenges.find((item) => item.id === body.challengeId);
  if (!challenge) {
    return NextResponse.json({ ok: false, message: "Unknown challenge." }, { status: 404 });
  }

  const evidence = session.progress.evidenceNotebooks.find(
    (item) => item.challengeId === challenge.id,
  );
  const generatedAt = new Date().toISOString();
  const content = generateReport({ challenge, evidence, generatedAt }, body.format);

  const progress = await recordGeneratedReport({
    sessionId,
    challengeId: challenge.id,
    format: body.format,
    title: challenge.title,
  });

  return NextResponse.json({
    ok: true,
    fileName: getReportFileName(challenge, body.format),
    contentType: getReportContentType(body.format),
    content,
    progress,
  });
}

function isReportRequest(value: unknown): value is {
  challengeId: string;
  format: ReportFormat;
} {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.challengeId === "string" &&
    (candidate.format === "markdown" || candidate.format === "json" || candidate.format === "csv")
  );
}
