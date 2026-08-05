"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Challenge, LabEndpoint } from "@/data/challenges";

/**
 * Lab status for the UI.
 *
 * Status now comes from the portal's own cached endpoint rather than each
 * browser probing each lab container directly. One shared subscription serves
 * every component on the page, and the server caches the underlying Docker and
 * health checks, so a full classroom costs one probe round per interval instead
 * of one per student per lab.
 */

export type RuntimeState = "checking" | "up" | "starting" | "down" | "unknown";

export type LabHealthRecord = {
  challengeId: string;
  title: string;
  serviceName: string;
  baseUrl: string | null;
  status: Exclude<RuntimeState, "checking">;
  detail: string;
  responseTimeMs: number | null;
};

export type LabHealthSnapshot = {
  checkedAt: string;
  dockerAvailable: boolean;
  dockerDetail: string;
  labs: LabHealthRecord[];
  summary: { up: number; down: number; starting: number; unknown: number };
};

const pollIntervalMs = 15_000;

type Listener = (snapshot: LabHealthSnapshot | null) => void;

const listeners = new Set<Listener>();
let latest: LabHealthSnapshot | null = null;
let pending: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

async function loadSnapshot() {
  // Collapse overlapping refreshes triggered by several mounted components.
  if (pending) return pending;

  pending = (async () => {
    try {
      const response = await fetch("/api/labs/health", { cache: "no-store" });
      if (!response.ok) return;

      const body = (await response.json()) as { ok: boolean; health: LabHealthSnapshot };
      if (body.ok) {
        latest = body.health;
        for (const listener of listeners) listener(latest);
      }
    } catch {
      // A failed status poll must never break the page it is decorating.
    } finally {
      pending = null;
    }
  })();

  return pending;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(latest);

  if (!timer) {
    timer = setInterval(() => void loadSnapshot(), pollIntervalMs);
  }
  void loadSnapshot();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useLabHealth() {
  const [snapshot, setSnapshot] = useState<LabHealthSnapshot | null>(latest);

  useEffect(() => subscribe(setSnapshot), []);

  const refresh = useCallback(async () => {
    await loadSnapshot();
  }, []);

  return { snapshot, refresh };
}

export function useLabStatus(lab?: LabEndpoint) {
  const { snapshot, refresh } = useLabHealth();

  const record = useMemo(
    () => snapshot?.labs.find((item) => item.serviceName === lab?.serviceName),
    [snapshot, lab?.serviceName],
  );

  const status: RuntimeState = !lab ? "unknown" : (record?.status ?? "checking");

  return {
    status,
    detail: record?.detail ?? "",
    lastChecked: snapshot ? new Date(snapshot.checkedAt) : null,
    refresh,
  };
}

export function useLabStatusMap(challenges: Challenge[]) {
  const { snapshot, refresh } = useLabHealth();

  const statuses = useMemo(() => {
    const byChallenge = new Map(snapshot?.labs.map((lab) => [lab.challengeId, lab.status]) ?? []);
    return Object.fromEntries(
      challenges.map((challenge) => [
        challenge.id,
        challenge.lab ? (byChallenge.get(challenge.id) ?? "checking") : "unknown",
      ]),
    ) as Record<string, RuntimeState>;
  }, [challenges, snapshot]);

  return useMemo(
    () => ({ statuses, refresh, snapshot, lastChecked: snapshot ? new Date(snapshot.checkedAt) : null }),
    [refresh, snapshot, statuses],
  );
}

export function statusLabel(status: RuntimeState) {
  if (status === "up") return "Up";
  if (status === "starting") return "Starting";
  if (status === "down") return "Down";
  if (status === "unknown") return "Unknown";
  return "Checking";
}

export function statusTone(status: RuntimeState) {
  if (status === "up") return "green";
  if (status === "starting") return "amber";
  if (status === "down") return "red";
  if (status === "unknown") return "slate";
  return "amber";
}

/** Human-readable "checked 12s ago" for the status badges. */
export function formatLastChecked(lastChecked: Date | null) {
  if (!lastChecked) return "not checked yet";

  const seconds = Math.max(0, Math.round((Date.now() - lastChecked.getTime()) / 1000));
  if (seconds < 5) return "checked just now";
  if (seconds < 60) return `checked ${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  return `checked ${minutes}m ago`;
}
