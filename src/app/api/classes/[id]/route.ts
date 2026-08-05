import { NextRequest, NextResponse } from "next/server";
import {
  getClassDetail,
  listClassesForInstructor,
  regenerateJoinCode,
  setClassStatus,
} from "@/lib/store/classes-store";
import { readJsonBody, readString, requireInstructor } from "@/lib/class-access";

/**
 * GET   full class detail with the enrolled roster.
 * PATCH archive, restore, or regenerate the join code.
 *
 * Every store call is scoped by instructor id, so a valid class id belonging to
 * another instructor resolves to "not found" rather than acting on it.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireInstructor(request, false);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  const detail = getClassDetail(guard.session.student.id, id);

  if (!detail) {
    return NextResponse.json({ ok: false, message: "Class not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, class: detail });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireInstructor(request, true);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (!body) {
    return NextResponse.json({ ok: false, message: "Invalid JSON request." }, { status: 400 });
  }

  const action = readString(body, "action");
  const instructorId = guard.session.student.id;

  if (action === "archive" || action === "restore") {
    const status = action === "archive" ? "archived" : "active";
    if (!setClassStatus(instructorId, id, status)) {
      return NextResponse.json({ ok: false, message: "Class not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      message: action === "archive" ? "Class archived. Its data is kept." : "Class restored.",
      classes: listClassesForInstructor(instructorId, "active"),
      archived: listClassesForInstructor(instructorId, "archived"),
    });
  }

  if (action === "regenerate-code") {
    const joinCode = regenerateJoinCode(instructorId, id);
    if (!joinCode) {
      return NextResponse.json({ ok: false, message: "Class not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      joinCode,
      message: `New join code: ${joinCode}. The previous code no longer works.`,
      classes: listClassesForInstructor(instructorId, "active"),
    });
  }

  return NextResponse.json(
    { ok: false, message: 'action must be "archive", "restore", or "regenerate-code".' },
    { status: 400 },
  );
}
