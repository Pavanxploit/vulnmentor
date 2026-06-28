"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Challenge } from "@/data/challenges";

export type AttemptRecord = {
  id: string;
  challengeId: string;
  correct: boolean;
  flagPreview: string;
  submittedAt: string;
};

export type ProgressState = {
  completed: string[];
  attempts: AttemptRecord[];
};

const progressStorageKey = "vulnmentor-progress-v1";
const emptyProgress: ProgressState = { completed: [], attempts: [] };

export function useLearningProgress(challenges: Challenge[]) {
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);

  useEffect(() => {
    const loadProgress = window.setTimeout(() => {
      setProgress(readStoredProgress());
    }, 0);
    return () => window.clearTimeout(loadProgress);
  }, []);

  const saveProgress = useCallback((nextProgress: ProgressState) => {
    setProgress(nextProgress);
    window.localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
  }, []);

  const recordAttempt = useCallback(
    (challengeId: string, flagPreview: string, correct: boolean) => {
      const attempt: AttemptRecord = {
        id: `attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        challengeId,
        correct,
        flagPreview,
        submittedAt: new Date().toISOString(),
      };

      setProgress((current) => {
        const completed = correct && !current.completed.includes(challengeId)
          ? [...current.completed, challengeId]
          : current.completed;
        const nextProgress = {
          completed,
          attempts: [attempt, ...current.attempts].slice(0, 50),
        };
        window.localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
        return nextProgress;
      });
    },
    [],
  );

  const resetProgress = useCallback(() => {
    saveProgress(emptyProgress);
  }, [saveProgress]);

  return useMemo(() => {
    const totalPoints = challenges.reduce((sum, challenge) => sum + challenge.points, 0);
    const earnedPoints = challenges
      .filter((challenge) => progress.completed.includes(challenge.id))
      .reduce((sum, challenge) => sum + challenge.points, 0);
    const completion = challenges.length
      ? Math.round((progress.completed.length / challenges.length) * 100)
      : 0;
    const correctAttempts = progress.attempts.filter((attempt) => attempt.correct).length;
    const accuracy = progress.attempts.length
      ? Math.round((correctAttempts / progress.attempts.length) * 100)
      : 0;

    return {
      progress,
      completion,
      earnedPoints,
      totalPoints,
      accuracy,
      recordAttempt,
      resetProgress,
    };
  }, [challenges, progress, recordAttempt, resetProgress]);
}

function readStoredProgress(): ProgressState {
  if (typeof window === "undefined") return emptyProgress;

  try {
    const raw = window.localStorage.getItem(progressStorageKey);
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as ProgressState;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    };
  } catch {
    return emptyProgress;
  }
}

export function previewFlag(flag: string) {
  if (flag.length <= 10) return flag;
  return `${flag.slice(0, 6)}...${flag.slice(-4)}`;
}
