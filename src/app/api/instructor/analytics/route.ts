import { NextRequest, NextResponse } from "next/server";
import { getInstructorAnalytics, getStudentSession } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";

export async function GET(request: NextRequest) {
  const session = await getStudentSession(getSessionId(request));

  if (!session || session.student.role !== "instructor") {
    return NextResponse.json({ ok: false, message: "Instructor access required." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    analytics: await getInstructorAnalytics(),
  });
}
