import { type NextRequest } from "next/server";
import { challenges } from "@/data/challenges";
import { getStudentSession } from "@/lib/progress-store";
import { getSessionId } from "@/lib/session-cookie";
import { rejectUntrustedOrigin } from "@/lib/request-origin";
import { checkRateLimit, rateLimitResponseHeaders } from "@/lib/rate-limit";
import { mentorNudge } from "@/lib/mentor";
import { summarizeLab } from "@/lib/learner-analytics";

export async function POST(request: NextRequest) {
  const rejected = rejectUntrustedOrigin(request);
  if (rejected) return rejected;
  const session = await getStudentSession(getSessionId(request));
  if (!session)
    return Response.json(
      { message: "Sign in to use the mentor." },
      { status: 401 },
    );
  const limit = checkRateLimit("mentor:" + session.student.id, {
    limit: 6,
    windowMs: 60000,
  });
  if (!limit.allowed)
    return Response.json(
      { message: "Try again in a minute." },
      { status: 429, headers: rateLimitResponseHeaders(limit) },
    );
  const body = await request.json().catch(() => null);
  const lab = challenges.find((entry) => entry.id === body?.labId);
  if (!lab || Object.keys(body).length !== 1)
    return Response.json(
      { message: "Choose a lesson from this local catalog." },
      { status: 400 },
    );
  const stats = summarizeLab(session.progress, lab.id);
  const solved = session.progress.completed.includes(lab.id);
  const message = solved
    ? lab.mitigation[0]
    : await mentorNudge(lab.title, stats.attempts, stats.hints);
  return Response.json(
    { message: lab.title + " · " + message },
    { headers: { "cache-control": "no-store" } },
  );
}
