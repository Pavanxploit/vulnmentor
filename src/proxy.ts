import { NextResponse, type NextRequest } from "next/server";
import pino from "pino";

const log = pino({ base: { service: "vulnmentor" } });
export function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  log.info(
    { requestId, method: request.method, path: request.nextUrl.pathname },
    "api.request",
  );
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return response;
}
export const config = { matcher: "/api/:path*" };
