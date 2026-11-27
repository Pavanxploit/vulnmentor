import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/flags/verify/route";
import { resetRateLimits } from "@/lib/rate-limit";
import { recordProgressAttempt } from "@/lib/progress-store";
import { createEmptyProgress } from "@/lib/progress-types";

vi.mock("@/lib/progress-store", () => ({ recordProgressAttempt: vi.fn() }));
const url = "http://localhost:3000/api/flags/verify";
function submit(body: string, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest(url, {
      method: "POST",
      headers: {
        host: "localhost:3000",
        cookie: "vulnmentor_session=fixture",
        ...headers,
      },
      body,
    }),
  );
}
const mismatch = JSON.stringify({
  challengeId: "api-excessive-data-exposure",
  flag: "sample",
});
beforeEach(() => {
  resetRateLimits();
  vi.resetAllMocks();
});

it.each([
  ["malformed JSON", "{", {}, 400],
  ["wrong type", '{"challengeId":2,"flag":"sample"}', {}, 400],
  ["unknown challenge", '{"challengeId":"unknown","flag":"sample"}', {}, 404],
  ["missing session", mismatch, { cookie: "" }, 401],
  ["foreign origin", mismatch, { origin: "https://example.org" }, 403],
] as const)(
  "rejects %s before writing progress",
  async (_, body, headers, status) => {
    expect((await submit(body, headers)).status).toBe(status);
    expect(recordProgressAttempt).not.toHaveBeenCalled();
  },
);
it("records an incorrect attempt for its session", async () => {
  vi.mocked(recordProgressAttempt).mockResolvedValue(createEmptyProgress());
  expect(await (await submit(mismatch)).json()).toMatchObject({
    ok: true,
    correct: false,
  });
  expect(recordProgressAttempt).toHaveBeenCalledWith({
    sessionId: "fixture",
    challengeId: "api-excessive-data-exposure",
    correct: false,
    flagPreview: "***",
  });
});
it("rejects an expired session", async () => {
  vi.mocked(recordProgressAttempt).mockResolvedValue(null);
  expect((await submit(mismatch)).status).toBe(401);
});
