import { NextResponse, type NextRequest } from "next/server";
import { classesAvailable } from "./store/classes-store";
import { getStudentSession } from "./progress-store";
import { getSessionId } from "./session-cookie";
import { rejectUntrustedOrigin } from "./request-origin";

/**
 * Shared guard chain for the class routes.
 *
 * Every mutation runs the same checks in the same order, so a new route cannot
 * accidentally ship with one missing.
 */

type Session = NonNullable<Awaited<ReturnType<typeof getStudentSession>>>;
type Guarded = { error: NextResponse; session?: never } | { error?: never; session: Session };

export function classesUnavailableResponse() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Class management requires the SQLite provider. Unset VULNMENTOR_DATABASE_PROVIDER or set it to \"sqlite\".",
    },
    { status: 501 },
  );
}

export async function requireSignedIn(request: NextRequest, mutating: boolean): Promise<Guarded> {
  if (mutating) {
    const untrusted = rejectUntrustedOrigin(request);
    if (untrusted) return { error: untrusted };
  }

  if (!classesAvailable()) return { error: classesUnavailableResponse() };

  const session = await getStudentSession(getSessionId(request));
  if (!session) {
    return {
      error: NextResponse.json({ ok: false, message: "Sign in to continue." }, { status: 401 }),
    };
  }

  return { session };
}

export async function requireInstructor(request: NextRequest, mutating: boolean): Promise<Guarded> {
  const result = await requireSignedIn(request, mutating);
  if (result.error) return result;

  if (result.session.student.role !== "instructor") {
    return {
      error: NextResponse.json(
        { ok: false, message: "Instructor access required." },
        { status: 403 },
      ),
    };
  }

  return result;
}

export async function readJsonBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (!text) return {};
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function readString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value : "";
}
