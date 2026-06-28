import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStudentSession } from "./progress-store";
import { sessionCookieName } from "./session-cookie";
import type { UserRole } from "./progress-types";

export async function requireAuthenticatedPage(nextPath: string) {
  const session = await getCurrentSessionFromCookies();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}

export async function requireRolePage(nextPath: string, roles: UserRole[]) {
  const session = await requireAuthenticatedPage(nextPath);

  if (!roles.includes(session.student.role)) {
    redirect("/dashboard");
  }

  return session;
}

export async function getCurrentSessionFromCookies() {
  const cookieStore = await cookies();
  return getStudentSession(cookieStore.get(sessionCookieName)?.value ?? null);
}
