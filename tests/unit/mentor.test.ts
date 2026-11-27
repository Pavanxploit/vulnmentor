import { afterEach, expect, it, vi } from "vitest";
import { mentorNudge } from "@/lib/mentor";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("changes the nudge as evidence accumulates", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  expect(await mentorNudge("Profile", 0, 0)).toMatch(/expected rule/);
  expect(await mentorNudge("Profile", 8, 2)).toMatch(/secure implementation/);
});
it.each(["1", "unapproved free text"])(
  "restricts model output to authored coaching",
  async (answer) => {
    vi.stubEnv("OPENAI_API_KEY", "fixture");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ output: [{ content: [{ text: answer }] }] }),
        ),
    );
    expect(await mentorNudge("Profile", 8, 2)).toMatch(
      answer === "1" ? /evidence you collected/ : /secure implementation/,
    );
  },
);
