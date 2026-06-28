import type { NextRequest } from "next/server";

export const sessionCookieName = "vulnmentor_session";

export function getSessionId(request: NextRequest) {
  return request.cookies.get(sessionCookieName)?.value ?? null;
}
