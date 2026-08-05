"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, LogIn, RefreshCcw } from "lucide-react";
import { Badge, EmptyState, ErrorNotice, RowSkeleton, Spinner, cn } from "./academy-ui";

type StudentClassRow = {
  id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  joinedAt: string;
  instructorName: string;
};

/**
 * Student-facing class list with the join form.
 *
 * Rendered only for signed-in students; progress and lab work are entirely
 * independent of class membership, so this panel never gates anything.
 */
export function MyClassesPanel() {
  const [classes, setClasses] = useState<StudentClassRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [notice, setNotice] = useState<{ tone: "green" | "amber" | "red"; text: string } | null>(null);

  const loadClasses = useCallback(async () => {
    setState("loading");

    try {
      const response = await fetch("/api/classes", { cache: "no-store" });
      const body = (await response.json()) as {
        ok: boolean;
        classes?: StudentClassRow[];
        message?: string;
      };

      if (!response.ok || !body.ok || !body.classes) {
        setMessage(body.message ?? "Could not load your classes.");
        setState("error");
        return;
      }

      setClasses(body.classes);
      setState("ready");
    } catch {
      setMessage("Could not reach the portal to load your classes.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    const start = window.setTimeout(() => void loadClasses(), 0);
    return () => window.clearTimeout(start);
  }, [loadClasses]);

  async function join() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setNotice(null);

    try {
      const response = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ joinCode }),
      });
      const body = (await response.json()) as {
        ok: boolean;
        reason?: string;
        message?: string;
        classes?: StudentClassRow[];
      };

      // Already being enrolled is not an error worth alarming the student about.
      const tone = body.ok ? "green" : body.reason === "already-enrolled" ? "amber" : "red";
      setNotice({ tone, text: body.message ?? "" });

      if (body.classes) setClasses(body.classes);
      if (body.ok) setJoinCode("");
    } catch {
      setNotice({ tone: "red", text: "Could not reach the portal to join." });
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-cyan-200" aria-hidden="true" />
            <p className="text-sm font-semibold text-cyan-200">My Classes</p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Your batches</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Join with the code your instructor shared. Your lab progress stays the same either way.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadClasses()}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-semibold text-slate-200" htmlFor="class-join-code">
          Join code
          <input
            id="class-join-code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") void join();
            }}
            placeholder="ABC1234"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm tracking-[0.2em] text-white outline-none placeholder:tracking-normal placeholder:text-slate-500 focus:border-cyan-300"
          />
        </label>
        <button
          type="button"
          onClick={() => void join()}
          disabled={joining || !joinCode.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {joining ? <Spinner className="border-slate-900/30 border-t-slate-900" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
          {joining ? "Joining..." : "Join class"}
        </button>
      </div>

      {notice ? (
        <p
          className={cn(
            "mt-4 rounded-md border p-3 text-sm leading-6",
            notice.tone === "green" && "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
            notice.tone === "amber" && "border-amber-300/25 bg-amber-300/10 text-amber-100",
            notice.tone === "red" && "border-rose-300/25 bg-rose-300/10 text-rose-100",
          )}
        >
          {notice.text}
        </p>
      ) : null}

      {state === "error" ? (
        <div className="mt-4">
          <ErrorNotice message={message} onRetry={() => void loadClasses()} />
        </div>
      ) : null}

      {state === "loading" ? <div className="mt-4"><RowSkeleton count={2} /></div> : null}

      {state === "ready" && classes.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={GraduationCap}
            title="You have not joined a class yet"
            body="Ask your instructor for the join code for your batch and enter it above. Joining is optional — all labs are open to you either way."
          />
        </div>
      ) : null}

      {state === "ready" && classes.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {classes.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-white/10 bg-slate-950/50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                  {item.status === "archived" ? <Badge tone="slate">Archived</Badge> : null}
                </div>
                {item.description ? (
                  <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">
                  Instructor: {item.instructorName} · joined{" "}
                  {new Date(item.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
