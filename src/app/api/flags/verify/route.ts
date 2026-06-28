import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { recordProgressAttempt } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";

const flagHashesByChallenge = new Map<string, string>([
  ["web-sqli-login", "bd1078d83ec94b44d7891a6935439768e3cf59c1735fe6a893cb157b8255ee4a"],
  ["web-xss-comment", "e5d780609c26d150c036f08462bdf635cef13b50c4e2b015c481dcd962819af6"],
  ["api-broken-auth", "d2c1051df41280952d8939eda4a1471ea262abe5b006dc12a5121e3d04a99b5e"],
  ["api-jwt-tampering", "6dddf39e4f32bd65082ec6f68391386edec3c3bd6123d9f77f879f6c743686ea"],
  ["api-rate-limit-bypass", "17aeb80d80b99303355e88fd3d17d2beb1cd5c71ea10ab7711cb295225ef1967"],
  ["api-excessive-data-exposure", "43b51df386690149f80278da0f419bedace1a4274156acce617fd995c992b9b9"],
]);

export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, message: "Sign in before submitting flags." },
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

  if (!isFlagRequest(body)) {
    return NextResponse.json(
      { ok: false, message: "challengeId and flag are required." },
      { status: 400 },
    );
  }

  const expectedFlagHash = flagHashesByChallenge.get(body.challengeId);

  if (!expectedFlagHash) {
    return NextResponse.json(
      { ok: false, message: "Challenge verifier is not available yet." },
      { status: 404 },
    );
  }

  const submittedFlag = body.flag.trim();
  const correct = safeHashEqual(hashFlag(submittedFlag), expectedFlagHash);
  const progress = await recordProgressAttempt({
    sessionId,
    challengeId: body.challengeId,
    flagPreview: previewFlag(submittedFlag),
    correct,
  });

  if (!progress) {
    return NextResponse.json(
      { ok: false, message: "Session expired. Please sign in again." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    correct,
    progress,
    message: correct
      ? "Flag accepted. Lab marked as solved."
      : "Flag mismatch. Review the lab behavior and try again.",
  });
}

function previewFlag(flag: string) {
  if (flag.length <= 10) return "***";
  return `${flag.slice(0, 6)}...${flag.slice(-4)}`;
}

function hashFlag(flag: string) {
  return createHash("sha256").update(`vulnmentor:${flag}`).digest("hex");
}

function safeHashEqual(actualHash: string, expectedHash: string) {
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function isFlagRequest(value: unknown): value is {
  challengeId: string;
  flag: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.challengeId === "string" &&
    typeof candidate.flag === "string"
  );
}
