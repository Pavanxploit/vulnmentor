import { NextRequest, NextResponse } from "next/server";
import {
  createClass,
  listClassesForInstructor,
  listClassesForStudent,
  type ClassStatus,
} from "@/lib/store/classes-store";
import { readJsonBody, readString, requireInstructor, requireSignedIn } from "@/lib/class-access";

/**
 * GET  role-aware list: an instructor's own classes, or a student's enrolments.
 * POST create a class (instructor only).
 */
export async function GET(request: NextRequest) {
  const guard = await requireSignedIn(request, false);
  if (guard.error) return guard.error;

  const { student } = guard.session;

  if (student.role === "instructor") {
    const status: ClassStatus =
      request.nextUrl.searchParams.get("status") === "archived" ? "archived" : "active";

    return NextResponse.json({
      ok: true,
      role: "instructor",
      status,
      classes: await listClassesForInstructor(student.id, status),
    });
  }

  return NextResponse.json({
    ok: true,
    role: "student",
    classes: await listClassesForStudent(student.id),
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireInstructor(request, true);
  if (guard.error) return guard.error;

  const body = await readJsonBody(request);
  if (!body) {
    return NextResponse.json({ ok: false, message: "Invalid JSON request." }, { status: 400 });
  }

  const name = readString(body, "name").trim();
  if (!name) {
    return NextResponse.json({ ok: false, message: "Class name is required." }, { status: 400 });
  }

  try {
    const created = await createClass({
      instructorId: guard.session.student.id,
      name,
      description: readString(body, "description"),
    });

    return NextResponse.json({
      ok: true,
      message: `Created "${created.name}". Share join code ${created.joinCode}.`,
      classes: await listClassesForInstructor(guard.session.student.id, "active"),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not create class." },
      { status: 400 },
    );
  }
}
