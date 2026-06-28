"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Challenge } from "@/data/challenges";
import {
  emptyProgress,
  type ProgressState,
  type StudentSession,
} from "@/lib/progress-types";

type SessionResponse = {
  authenticated: boolean;
  student: StudentSession | null;
  progress: ProgressState | null;
};

const progressStorageKey = "vulnmentor-progress-v1";

export function useLearningProgress(challenges: Challenge[]) {
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [student, setStudent] = useState<StudentSession | null>(null);
  const [progressMode, setProgressMode] = useState<"loading" | "backend" | "local">("loading");
  const [authMessage, setAuthMessage] = useState("");

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const result = (await response.json()) as SessionResponse;

      if (result.authenticated && result.student && result.progress) {
        setStudent(result.student);
        setProgress(result.progress);
        setProgressMode("backend");
        return;
      }
    } catch {
      setAuthMessage("Account progress is unavailable. Sign in again if the session expired.");
    }

    setStudent(null);
    setProgress(readStoredProgress());
    setProgressMode("local");
  }, []);

  useEffect(() => {
    const loadProgress = window.setTimeout(() => {
      void loadSession();
    }, 0);
    return () => window.clearTimeout(loadProgress);
  }, [loadSession]);

  const applyProgress = useCallback(
    (nextProgress: ProgressState) => {
      setProgress(nextProgress);
      if (!student) {
        window.localStorage.setItem(progressStorageKey, JSON.stringify(nextProgress));
      }
    },
    [student],
  );

  const logoutStudent = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setStudent(null);
    setProgress(readStoredProgress());
    setProgressMode("local");
    setAuthMessage("Signed out.");
  }, []);

  const recordLocalAttempt = useCallback(
    (challengeId: string, flagPreview: string, correct: boolean) => {
      const attempt = {
        id: `attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        challengeId,
        correct,
        flagPreview,
        submittedAt: new Date().toISOString(),
      };

      setProgress((current) => {
        const completed =
          correct && !current.completed.includes(challengeId)
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

  const resetLocalProgress = useCallback(() => {
    setProgress(emptyProgress);
    window.localStorage.setItem(progressStorageKey, JSON.stringify(emptyProgress));
  }, []);

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
      progressMode,
      student,
      authMessage,
      completion,
      earnedPoints,
      totalPoints,
      accuracy,
      applyProgress,
      logoutStudent,
      recordLocalAttempt,
      resetLocalProgress,
      refreshProgress: loadSession,
    };
  }, [
    authMessage,
    challenges,
    progress,
    progressMode,
    student,
    applyProgress,
    loadSession,
    logoutStudent,
    recordLocalAttempt,
    resetLocalProgress,
  ]);
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
  if (flag.length <= 10) return "***";
  return `${flag.slice(0, 6)}...${flag.slice(-4)}`;
}
