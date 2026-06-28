import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";

export async function GET(request: NextRequest) {
  const session = await getStudentSession(getSessionId(request));

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      student: null,
      progress: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    student: session.student,
    progress: session.progress,
  });
}
