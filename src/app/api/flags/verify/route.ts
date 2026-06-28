import { NextRequest, NextResponse } from "next/server";

const flagsByChallenge = new Map<string, string>([
  ["web-sqli-login", "VM{sql_auth_bypass}"],
  ["api-broken-auth", "VM{api_bola_idor_mastered}"],
  ["api-jwt-tampering", "VM{jwt_claims_need_verification}"],
  ["api-rate-limit-bypass", "VM{rate_limits_need_stable_keys}"],
]);

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

  if (!isFlagRequest(body)) {
    return NextResponse.json(
      { ok: false, message: "challengeId and flag are required." },
      { status: 400 },
    );
  }

  const expectedFlag = flagsByChallenge.get(body.challengeId);

  if (!expectedFlag) {
    return NextResponse.json(
      { ok: false, message: "Challenge verifier is not available yet." },
      { status: 404 },
    );
  }

  const correct = body.flag.trim() === expectedFlag;

  return NextResponse.json({
    ok: true,
    correct,
    message: correct
      ? "Flag accepted. Lab marked as solved."
      : "Flag mismatch. Review the lab behavior and try again.",
  });
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
