import { NextRequest, NextResponse } from "next/server";
import { recordQuizResult } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ ok: false, message: "Sign in before saving quiz results." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON request." }, { status: 400 });
  }

  if (!isQuizRequest(body)) {
    return NextResponse.json({ ok: false, message: "lessonSlug, score, total, and answers are required." }, { status: 400 });
  }

  const progress = await recordQuizResult({
    sessionId,
    lessonSlug: body.lessonSlug,
    score: body.score,
    total: body.total,
    answers: body.answers,
  });

  if (!progress) {
    return NextResponse.json({ ok: false, message: "Session expired. Please sign in again." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, progress });
}

function isQuizRequest(value: unknown): value is {
  lessonSlug: string;
  score: number;
  total: number;
  answers: Array<{ question: string; selected: string; correct: boolean }>;
} {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.lessonSlug === "string" &&
    typeof candidate.score === "number" &&
    typeof candidate.total === "number" &&
    Array.isArray(candidate.answers) &&
    candidate.answers.every((answer) => {
      if (!answer || typeof answer !== "object") return false;
      const item = answer as Record<string, unknown>;
      return (
        typeof item.question === "string" &&
        typeof item.selected === "string" &&
        typeof item.correct === "boolean"
      );
    })
  );
}
