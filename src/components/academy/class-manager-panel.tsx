"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  GraduationCap,
  KeyRound,
  Plus,
  RefreshCcw,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Badge,
  EmptyState,
  ErrorNotice,
  RowSkeleton,
  SectionHeading,
  Spinner,
  cn,
} from "./academy-ui";

/**
 * Instructor class management for the Guide Console.
 *
 * Every action is also enforced server-side; hiding or disabling a control here
 * is presentation only.
 */

type ClassSummary = {
  id: string;
  name: string;
  description: string;
  joinCode: string;
  status: "active" | "archived";
  createdAt: string;
  studentCount: number;
  completedLabs: number;
  averageCompletion: number;
  activeThisWeek: number;
};

type ClassStudentRow = {
  id: string;
  name: string;
  email: string;
  usn: string;
  joinedAt: string;
  lastSeenAt: string;
  completedLabs: number;
  attempts: number;
  accuracy: number;
};

type ClassDetail = ClassSummary & { students: ClassStudentRow[] };

export function ClassManagerPanel() {
  const [view, setView] = useState<"active" | "archived">("active");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [openClass, setOpenClass] = useState<ClassDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadClasses = useCallback(async (status: "active" | "archived") => {
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(`/api/classes?status=${status}`, { cache: "no-store" });
      const body = (await response.json()) as { ok: boolean; classes?: ClassSummary[]; message?: string };

      if (!response.ok || !body.ok || !body.classes) {
        setMessage(body.message ?? "Could not load classes.");
        setState("error");
        return;
      }

      setClasses(body.classes);
      setState("ready");
    } catch {
      setMessage("Could not reach the portal to load classes.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    const start = window.setTimeout(() => void loadClasses(view), 0);
    return () => window.clearTimeout(start);
  }, [loadClasses, view]);

  async function createClass() {
    if (!name.trim()) return;
    setCreating(true);
    setNotice(null);

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const body = (await response.json()) as { ok: boolean; message?: string; classes?: ClassSummary[] };

      setNotice({ tone: body.ok ? "green" : "red", text: body.message ?? "" });
      if (body.ok) {
        setName("");
        setDescription("");
        if (view === "active" && body.classes) setClasses(body.classes);
        else await loadClasses(view);
      }
    } catch {
      setNotice({ tone: "red", text: "Could not reach the portal to create the class." });
    } finally {
      setCreating(false);
    }
  }

  async function patchClass(classId: string, action: "archive" | "restore" | "regenerate-code") {
    setBusy(`${classId}:${action}`);
    setNotice(null);

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json()) as { ok: boolean; message?: string };

      setNotice({ tone: body.ok ? "green" : "red", text: body.message ?? "" });
      if (body.ok) {
        await loadClasses(view);
        if (openClass?.id === classId) await openDetail(classId);
      }
    } catch {
      setNotice({ tone: "red", text: "Could not reach the portal." });
    } finally {
      setBusy(null);
    }
  }

  async function openDetail(classId: string) {
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/classes/${classId}`, { cache: "no-store" });
      const body = (await response.json()) as { ok: boolean; class?: ClassDetail };
      setOpenClass(body.ok && body.class ? body.class : null);
    } catch {
      setOpenClass(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function removeStudent(classId: string, studentId: string) {
    setBusy(`${classId}:${studentId}`);
    setNotice(null);

    try {
      const response = await fetch(`/api/classes/${classId}/students/${studentId}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { ok: boolean; message?: string; class?: ClassDetail };

      setNotice({ tone: body.ok ? "green" : "red", text: body.message ?? "" });
      if (body.ok) {
        if (body.class) setOpenClass(body.class);
        await loadClasses(view);
      }
    } catch {
      setNotice({ tone: "red", text: "Could not reach the portal." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SectionHeading
          eyebrow="Classes"
          title="Class & Batch Management"
          body="Create a batch, share its join code, and track how the group is progressing."
        />
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-md border border-white/15 bg-white/5 p-1">
            {(["active", "archived"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={cn(
                  "min-h-9 rounded px-3 text-sm font-semibold capitalize",
                  view === option ? "bg-emerald-400 text-slate-950" : "text-slate-200 hover:bg-white/10",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadClasses(view)}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-md border border-white/10 bg-slate-950/50 p-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
        <label className="block text-sm font-semibold text-slate-200">
          Class name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="CSE 2026 Batch A"
            className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-200">
          Description <span className="font-normal text-slate-500">(optional)</span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Semester 6 web and API security practical"
            className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          />
        </label>
        <button
          type="button"
          onClick={() => void createClass()}
          disabled={creating || !name.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? <Spinner className="border-slate-900/30 border-t-slate-900" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          {creating ? "Creating..." : "Create class"}
        </button>
      </div>

      {notice ? (
        <p
          className={cn(
            "mt-4 rounded-md border p-3 text-sm leading-6",
            notice.tone === "green"
              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
              : "border-rose-300/25 bg-rose-300/10 text-rose-100",
          )}
        >
          {notice.text}
        </p>
      ) : null}

      {state === "error" ? (
        <div className="mt-4">
          <ErrorNotice message={message} onRetry={() => void loadClasses(view)} />
        </div>
      ) : null}

      {state === "loading" ? <div className="mt-4"><RowSkeleton count={2} /></div> : null}

      {state === "ready" && classes.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={GraduationCap}
            title={view === "active" ? "No active classes yet" : "No archived classes"}
            body={
              view === "active"
                ? "Create your first batch above. You will get a join code to share with students, and their progress will roll up here."
                : "Classes you archive appear here. Their data is kept and they can be restored at any time."
            }
          />
        </div>
      ) : null}

      {state === "ready" && classes.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {classes.map((item) => (
            <li key={item.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-semibold text-white">{item.name}</p>
                    <Badge tone={item.status === "active" ? "green" : "slate"}>
                      {item.status === "active" ? "Active" : "Archived"}
                    </Badge>
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                    <code className="rounded bg-slate-950 px-2 py-1 text-sm font-semibold tracking-[0.2em] text-emerald-200">
                      {item.joinCode}
                    </code>
                  </div>
                  <p className="text-xs text-slate-500">Share this code with students</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ClassStat label="Students" value={`${item.studentCount}`} />
                <ClassStat label="Avg completion" value={`${item.averageCompletion}%`} />
                <ClassStat label="Active this week" value={`${item.activeThisWeek}`} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void openDetail(item.id)}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  View students
                </button>
                <button
                  type="button"
                  onClick={() => void patchClass(item.id, "regenerate-code")}
                  disabled={busy !== null}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                >
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  {busy === `${item.id}:regenerate-code` ? "Working..." : "New join code"}
                </button>
                {item.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => void patchClass(item.id, "archive")}
                    disabled={busy !== null}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                  >
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    Archive
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void patchClass(item.id, "restore")}
                    disabled={busy !== null}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-emerald-400 px-3 text-xs font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                    Restore
                  </button>
                )}
              </div>

              {openClass?.id === item.id ? (
                <ClassRoster
                  detail={openClass}
                  loading={detailLoading}
                  busy={busy}
                  onClose={() => setOpenClass(null)}
                  onRemove={(studentId) => void removeStudent(item.id, studentId)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ClassStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ClassRoster({
  detail,
  loading,
  busy,
  onClose,
  onRemove,
}: {
  detail: ClassDetail;
  loading: boolean;
  busy: string | null;
  onClose: () => void;
  onRemove: (studentId: string) => void;
}) {
  return (
    <div className="mt-4 rounded-md border border-cyan-300/20 bg-cyan-300/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">
          Students in {detail.name} ({detail.students.length})
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-cyan-200 hover:text-cyan-100"
        >
          Hide
        </button>
      </div>

      {loading ? (
        <div className="mt-3">
          <RowSkeleton count={2} />
        </div>
      ) : detail.students.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={Users}
            title="No students have joined yet"
            body={`Share join code ${detail.joinCode}. Students enter it under My Classes on their dashboard.`}
          />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-slate-400">
                <th className="px-3 py-2 font-semibold">Student</th>
                <th className="px-3 py-2 font-semibold">Labs</th>
                <th className="px-3 py-2 font-semibold">Attempts</th>
                <th className="px-3 py-2 font-semibold">Accuracy</th>
                <th className="px-3 py-2 font-semibold">Joined</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {detail.students.map((student) => (
                <tr key={student.id} className="border-b border-white/10 align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-white">{student.name}</p>
                    <p className="mt-1 break-words text-xs text-slate-500">{student.email}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-200">{student.completedLabs}</td>
                  <td className="px-3 py-3 text-slate-200">{student.attempts}</td>
                  <td className="px-3 py-3 text-slate-200">{student.accuracy}%</td>
                  <td className="px-3 py-3 text-xs text-slate-400">
                    {new Date(student.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onRemove(student.id)}
                      disabled={busy !== null}
                      title="Removes them from this class only. Account and progress are kept."
                      className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                    >
                      <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            Removing a student unenrolls them from this class only. Their account, solved labs,
            attempts, and evidence notebooks are kept.
          </p>
        </div>
      )}
    </div>
  );
}
