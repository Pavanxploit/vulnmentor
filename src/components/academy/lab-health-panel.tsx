"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCcw, RotateCcw, ServerCog } from "lucide-react";
import { Badge, cn } from "./academy-ui";
import { formatLastChecked, statusLabel, statusTone, useLabHealth } from "./lab-status";

/**
 * Shared lab health surface for the dashboard and the Guide Console.
 *
 * Restart controls are rendered only when `canRestart` is set, which callers
 * gate on the instructor role. The API enforces the same rule independently:
 * hiding a button is presentation, not authorisation.
 */
export function LabHealthPanel({
  canRestart = false,
  compact = false,
}: {
  canRestart?: boolean;
  compact?: boolean;
}) {
  const { snapshot, refresh } = useLabHealth();
  const [busyService, setBusyService] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "green" | "red"; message: string } | null>(null);

  async function restart(serviceName?: string) {
    setBusyService(serviceName ?? "__all__");
    setNotice(null);

    try {
      const response = await fetch("/api/labs/restart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(serviceName ? { serviceName } : {}),
      });
      const body = (await response.json()) as { ok: boolean; message?: string };

      setNotice({
        tone: body.ok ? "green" : "red",
        message: body.message ?? (body.ok ? "Restarted." : "Restart failed."),
      });
    } catch {
      setNotice({ tone: "red", message: "Could not reach the portal to restart labs." });
    } finally {
      setBusyService(null);
      await refresh();
    }
  }

  const labs = snapshot?.labs ?? [];
  const summary = snapshot?.summary;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ServerCog className="h-4 w-4 text-cyan-200" aria-hidden="true" />
            <p className="text-sm font-semibold text-cyan-200">Lab Health</p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Local Docker labs</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {summary
              ? `${summary.up} up · ${summary.starting} starting · ${summary.down} down`
              : "Checking lab containers..."}
            <span className="text-slate-400">
              {" "}
              — {formatLastChecked(snapshot ? new Date(snapshot.checkedAt) : null)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          {canRestart ? (
            <button
              type="button"
              onClick={() => void restart()}
              disabled={busyService !== null}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {busyService === "__all__" ? "Restarting..." : "Restart all"}
            </button>
          ) : null}
        </div>
      </div>

      {snapshot && !snapshot.dockerAvailable ? (
        <p className="mt-4 flex items-start gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {snapshot.dockerDetail} Status below reflects whether each lab answers on its port.
          </span>
        </p>
      ) : null}

      {notice ? (
        <p
          className={cn(
            "mt-4 rounded-md border p-3 text-sm leading-6",
            notice.tone === "green"
              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
              : "border-rose-300/25 bg-rose-300/10 text-rose-100",
          )}
        >
          {notice.message}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {labs.map((lab) => (
          <li
            key={lab.challengeId}
            className="flex flex-col gap-3 rounded-md border border-white/10 bg-slate-950/40 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(lab.status)}>{statusLabel(lab.status)}</Badge>
                <p className="truncate text-sm font-semibold text-white">{lab.title}</p>
              </div>
              {!compact ? (
                <p className="mt-1 truncate text-xs text-slate-400">
                  {lab.baseUrl ? `${lab.baseUrl} — ` : ""}
                  {lab.detail}
                  {lab.responseTimeMs !== null ? ` (${lab.responseTimeMs}ms)` : ""}
                </p>
              ) : null}
            </div>

            {canRestart && lab.serviceName ? (
              <button
                type="button"
                onClick={() => void restart(lab.serviceName)}
                disabled={busyService !== null}
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {busyService === lab.serviceName ? "Restarting..." : "Restart"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {labs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Waiting for the first status check...</p>
      ) : null}
    </section>
  );
}
