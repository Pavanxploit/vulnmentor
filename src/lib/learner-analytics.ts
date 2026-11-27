import type { ProgressState } from "./progress-types";

/** Summarize the events retained in this learner's progress history. */
export function summarizeLab(progress: ProgressState, challengeId: string) {
  const attempts = progress.attempts.filter(
    (entry) => entry.challengeId === challengeId,
  );
  const hints = progress.hintViews.filter(
    (entry) => entry.challengeId === challengeId,
  );
  const solved = progress.completed.includes(challengeId);
  const firstCorrect = attempts.findLastIndex((entry) => entry.correct);
  const firstActivity = Math.min(
    ...attempts.map((entry) => Date.parse(entry.submittedAt)),
    ...hints.map((entry) => Date.parse(entry.viewedAt)),
  );
  const elapsed =
    firstCorrect < 0
      ? NaN
      : Date.parse(attempts[firstCorrect].submittedAt) - firstActivity;
  return {
    attempts: attempts.length,
    hints: new Set(hints.map((entry) => entry.hintIndex)).size,
    observedMinutes: Number.isFinite(elapsed)
      ? Math.max(0, Math.round(elapsed / 60000))
      : null,
    needsReview:
      !solved &&
      attempts.length >= 5 &&
      attempts.slice(0, 5).every((entry) => !entry.correct),
  };
}

export function studyStreak(progress: ProgressState, today = new Date()) {
  const dates = [
    ...progress.attempts.map((a) => a.submittedAt),
    ...progress.quizResults.map((q) => q.submittedAt),
    ...progress.hintViews.map((h) => h.viewedAt),
    ...progress.evidenceNotebooks.map((e) => e.updatedAt),
    ...progress.reports.map((r) => r.generatedAt),
  ];
  const days = new Set(dates.map((date) => date.slice(0, 10)));
  const dayMs = 86400000;
  let cursor = Date.parse(today.toISOString().slice(0, 10));
  const isoDay = () => new Date(cursor).toISOString().slice(0, 10);
  if (!days.has(isoDay())) cursor -= dayMs;
  let count = 0;
  while (days.has(isoDay())) {
    count++;
    cursor -= dayMs;
  }
  return count;
}
