import { NextRequest, NextResponse } from "next/server";
import { getClassDetail, removeStudentFromClass } from "@/lib/store/classes-store";
import { requireInstructor } from "@/lib/class-access";

/**
 * Removes a student from a class.
 *
 * This deletes the enrolment row only. The student's account, solved labs,
 * attempts, quiz results, hint usage, evidence notebooks, and reports are all
 * untouched, and they can rejoin with the current code.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; studentId: string }> },
) {
  const guard = await requireInstructor(request, true);
  if (guard.error) return guard.error;

  const { id, studentId } = await context.params;
  const instructorId = guard.session.student.id;

  if (!removeStudentFromClass(instructorId, id, studentId)) {
    return NextResponse.json(
      { ok: false, message: "That student is not enrolled in this class." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Student removed from the class. Their account and progress are unchanged.",
    class: getClassDetail(instructorId, id),
  });
}
