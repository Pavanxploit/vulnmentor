import { NextResponse, type NextRequest } from "next/server";

/**
 * Origin checking for state-changing routes.
 *
 * The session cookie is `SameSite=Lax`, which already blocks classic cross-site
 * CSRF. It is not sufficient here, because SameSite defines a "site" as
 * scheme + registrable domain and ignores the port. Every vulnerable Docker lab
 * is served from another port on localhost, so as far as the browser is
 * concerned `http://127.0.0.1:4060` (the stored-XSS lab) and
 * `http://localhost:3000` (the portal) are the same site — a payload landed in
 * a lab would travel with the student's portal cookie attached.
 *
 * The Origin header does include the port, so comparing it against the portal's
 * own host closes the pivot from a solved lab back into the portal API.
 */
export function isTrustedRequestOrigin(request: NextRequest) {
  // Browsers label same-origin navigations and fetches explicitly. `none` covers
  // direct address-bar requests, which cannot be attacker-initiated.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }

  const origin = request.headers.get("origin");

  // Absent Origin means a non-browser client (curl, the validation and
  // screenshot scripts). Those carry no ambient session cookie, so there is no
  // CSRF to prevent and rejecting them would break local tooling.
  if (!origin) return true;

  const host = request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Returns a ready response when the origin is untrusted, or null to continue.
 */
export function rejectUntrustedOrigin(request: NextRequest) {
  if (isTrustedRequestOrigin(request)) return null;

  return NextResponse.json(
    { ok: false, message: "Request origin is not allowed." },
    { status: 403 },
  );
}
