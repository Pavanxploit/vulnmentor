import { createHmac, timingSafeEqual } from "node:crypto";
import { type NextRequest } from "next/server";
import { getSessionId } from "@/lib/session-cookie";
import { getStudentSession } from "@/lib/progress-store";
import { rejectUntrustedOrigin } from "@/lib/request-origin";

const prerequisite = "api-excessive-data-exposure";
async function stage(request: NextRequest) {
  const id = getSessionId(request);
  const session = await getStudentSession(id);
  if (!id || !session)
    return {
      error: Response.json(
        { message: "Sign in to continue." },
        { status: 401 },
      ),
    };
  if (!session.progress.completed.includes(prerequisite))
    return {
      error: Response.json(
        {
          message:
            "Complete the Excessive Data Exposure lab to unlock this case.",
        },
        { status: 403 },
      ),
    };
  return {
    token: createHmac("sha256", id)
      .update("defender:response-contract:v1")
      .digest("hex"),
  };
}

export async function GET(request: NextRequest) {
  const result = await stage(request);
  return (
    result.error ||
    Response.json(
      { token: result.token },
      { headers: { "cache-control": "private, no-store" } },
    )
  );
}
export async function POST(request: NextRequest) {
  const rejected = rejectUntrustedOrigin(request);
  if (rejected) return rejected;
  const result = await stage(request);
  if (result.error) return result.error;
  const body = await request.json().catch(() => null);
  if (
    typeof body?.token !== "string" ||
    !/^[a-f0-9]{64}$/.test(body.token) ||
    !timingSafeEqual(
      Buffer.from(body.token, "hex"),
      Buffer.from(result.token, "hex"),
    )
  ) {
    return Response.json(
      { message: "Open the follow-up case again from your solved lab." },
      { status: 403 },
    );
  }
  const fields: unknown = body.fields;
  if (
    !Array.isArray(fields) ||
    fields.length > 10 ||
    fields.some((f) => typeof f !== "string")
  )
    return Response.json(
      { message: "Enter a JSON array of field names." },
      { status: 400 },
    );
  const fixture = {
    displayName: "Demo Student",
    staffNote: "Instructor review",
    internalId: 42,
  };
  const projected = Object.fromEntries(
    Object.entries(fixture).filter(([key]) => fields.includes(key)),
  );
  const passed = fields.length === 1 && fields[0] === "displayName";
  return Response.json({
    passed,
    projected,
    message: passed
      ? "Both checks passed. The public response contract is satisfied."
      : "Check failed. Keep the display name and exclude all other fields.",
  });
}
