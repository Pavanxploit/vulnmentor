"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Challenge, LabEndpoint } from "@/data/challenges";

export type RuntimeState = "checking" | "online" | "offline" | "planned";

export function useLabStatus(lab?: LabEndpoint) {
  const [status, setStatus] = useState<RuntimeState>(lab ? "checking" : "planned");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (!lab) {
      setStatus("planned");
      return;
    }

    try {
      const response = await fetch(lab.healthUrl, { cache: "no-store" });
      setStatus(response.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    } finally {
      setLastChecked(new Date());
    }
  }, [lab]);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => {
      void refresh();
    }, 0);
    const interval = window.setInterval(refresh, 15000);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { status, lastChecked, refresh };
}

export function useLabStatusMap(challenges: Challenge[]) {
  const [statuses, setStatuses] = useState<Record<string, RuntimeState>>(() =>
    Object.fromEntries(challenges.map((challenge) => [challenge.id, challenge.lab ? "checking" : "planned"])),
  );

  const refresh = useCallback(async () => {
    const nextEntries = await Promise.all(
      challenges.map(async (challenge) => {
        if (!challenge.lab) return [challenge.id, "planned"] as const;
        try {
          const response = await fetch(challenge.lab.healthUrl, { cache: "no-store" });
          return [challenge.id, response.ok ? "online" : "offline"] as const;
        } catch {
          return [challenge.id, "offline"] as const;
        }
      }),
    );
    setStatuses(Object.fromEntries(nextEntries));
  }, [challenges]);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => {
      void refresh();
    }, 0);
    const interval = window.setInterval(refresh, 15000);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return useMemo(() => ({ statuses, refresh }), [refresh, statuses]);
}

export function statusLabel(status: RuntimeState) {
  if (status === "online") return "Online";
  if (status === "offline") return "Offline";
  if (status === "planned") return "Planned";
  return "Checking";
}

export function statusTone(status: RuntimeState) {
  if (status === "online") return "green";
  if (status === "offline") return "red";
  if (status === "planned") return "slate";
  return "amber";
}
