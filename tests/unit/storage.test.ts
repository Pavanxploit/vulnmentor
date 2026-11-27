import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

it("isolates real SQLite accounts, preserves one solve across retries and expires a logged-out session", async () => {
  vi.stubEnv("VULNMENTOR_DATA_DIR", mkdtempSync(join(tmpdir(), "vm-unit-")));
  try {
    const { sqliteStore: store } = await import("@/lib/store/sqlite-store");
    const account = () =>
      store.registerAccount({
        name: "Student",
        email: randomUUID() + "@example.test",
        password: randomUUID(),
      });
    const [one, two] = await Promise.all([account(), account()]);
    const sessionId = one.session.id,
      challengeId = "api-excessive-data-exposure";
    const attempt = {
      sessionId,
      challengeId,
      flagPreview: "***",
      correct: true,
    };
    await store.recordProgressAttempt(attempt);
    const progress = await store.recordProgressAttempt(attempt);
    expect(progress?.completed).toEqual([challengeId]);
    expect(progress?.attempts).toHaveLength(2);
    await store.recordHintView({ sessionId, challengeId, hintIndex: 2 });
    expect(
      (await store.getStudentSession(two.session.id))?.progress.completed,
    ).toEqual([]);
    expect(
      (await store.getStudentSession(sessionId))?.progress.hintViews,
    ).toHaveLength(1);
    await store.destroySession(sessionId);
    expect(await store.recordProgressAttempt(attempt)).toBeNull();
  } finally {
    vi.unstubAllEnvs();
  }
});
