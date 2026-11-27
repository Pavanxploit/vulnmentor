import { expect, it } from "vitest";
import { createEmptyProgress } from "@/lib/progress-types";
import { summarizeLab } from "@/lib/learner-analytics";

const id = "lab";
function attempt(minute: number, correct = false, challengeId = id) {
  return {
    id: String(minute),
    flagPreview: "***",
    challengeId,
    correct,
    submittedAt: new Date(minute * 60000).toISOString(),
  };
}
it("counts consecutive failures separately for each lab", () => {
  const progress = createEmptyProgress();
  progress.attempts = [6, 5, 4, 3, 2].map((time) => attempt(time));
  progress.attempts.splice(2, 0, attempt(5, true, "other"));
  expect(summarizeLab(progress, id).needsReview).toBe(true);
  progress.attempts.pop();
  expect(summarizeLab(progress, id).needsReview).toBe(false);
  expect(summarizeLab(progress, id).observedMinutes).toBeNull();
});
it("measures the first observed solve, counting distinct hint levels", () => {
  const progress = createEmptyProgress();
  progress.completed = [id];
  progress.attempts = [attempt(10, true), attempt(8, true), attempt(6)];
  progress.hintViews = [3, 4].map((m) => ({
    id: String(m),
    challengeId: id,
    hintIndex: 1,
    viewedAt: new Date(m * 60000).toISOString(),
  }));
  expect(summarizeLab(progress, id)).toEqual({
    attempts: 3,
    hints: 1,
    needsReview: false,
    observedMinutes: 5,
  });
});

it("keeps yesterday's study streak across a UTC month boundary", async () => {
  const { studyStreak } = await import("@/lib/learner-analytics");
  const p = createEmptyProgress();
  p.attempts = ["2026-10-31", "2026-11-01"].map((day) => ({
    ...attempt(1),
    submittedAt: day + "T18:00:00Z",
  }));
  expect(studyStreak(p, new Date("2026-11-02T10:00:00Z"))).toBe(2);
  expect(studyStreak(p, new Date("2026-11-03T10:00:00Z"))).toBe(0);
});
