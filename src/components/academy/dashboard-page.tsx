"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Database, Flag, FlaskConical, RefreshCcw, ShieldCheck, Signal, Target, Trophy, UserRound } from "lucide-react";
import { challenges } from "@/data/challenges";
import { Badge, DashboardSidebar, MetricCard, SectionHeading } from "./academy-ui";
import { statusLabel, statusTone, useLabStatusMap } from "./lab-status";
import { useLearningProgress } from "./progress";

const learningPaths = [
  {
    title: "Beginner Web Security",
    body: "Start with SQL injection and stored XSS, then compare vulnerable and secure fixes.",
    progress: "2 live labs",
  },
  {
    title: "API Security Core",
    body: "Practice authorization, JWT trust boundaries, rate limits, and response minimization.",
    progress: "4 live labs",
  },
  {
    title: "Defender Thinking",
    body: "Read traces, identify root cause, and map each issue to mitigation steps.",
    progress: "Built into every lab",
  },
];

export function DashboardPage() {
  const { statuses, refresh } = useLabStatusMap(challenges);
  const {
    progress,
    progressMode,
    student,
    authMessage,
    completion,
    earnedPoints,
    totalPoints,
    accuracy,
    loginStudent,
    logoutStudent,
  } = useLearningProgress(challenges);
  const completedSet = new Set(progress.completed);
  const nextLab = challenges.find((challenge) => !completedSet.has(challenge.id)) ?? challenges[0];
  const recentAttempts = progress.attempts.slice(0, 4);
  const onlineCount = challenges.filter((challenge) => statuses[challenge.id] === "online").length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-[1500px] min-w-0 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <DashboardSidebar />

        <section className="min-w-0 space-y-5">
          <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <Badge tone={student ? "green" : "cyan"}>
                {student ? "Backend progress active" : "Academy dashboard"}
              </Badge>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Welcome back to VulnMentor</h1>
              <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-300">
                {student
                  ? `${student.name}${student.usn ? ` (${student.usn})` : ""}, your progress is now stored through the backend demo database.`
                  : "Continue your Web and API security path, monitor local lab status, and keep your project demo progress in one place."}
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 md:w-auto"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refresh labs
            </button>
          </div>

          <section id="progress" className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Progress" value={`${completion}%`} helper={`${progress.completed.length}/${challenges.length} labs solved`} icon={Trophy} />
            <MetricCard label="Points" value={`${earnedPoints}/${totalPoints}`} helper="Local demo score" icon={Flag} />
            <MetricCard label="Accuracy" value={`${accuracy}%`} helper={`${progress.attempts.length} flag attempts`} icon={Target} />
            <MetricCard
              label={student ? "Progress store" : "Lab status"}
              value={student ? "Backend" : `${onlineCount}/${challenges.length}`}
              helper={student ? "JSON database active" : "Docker targets online"}
              icon={student ? Database : Signal}
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-100">Continue Learning</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{nextLab.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{nextLab.summary}</p>
                </div>
                <Badge tone={statusTone(statuses[nextLab.id])}>{statusLabel(statuses[nextLab.id])}</Badge>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="cyan">{nextLab.category}</Badge>
                <Badge tone="amber">{nextLab.difficulty}</Badge>
                <Badge tone="green">{nextLab.points} pts</Badge>
              </div>
              <Link
                href={`/labs/${nextLab.id}`}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
              >
                Continue Lab
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>

            <section id="learning-paths" className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-white">Learning Paths</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {learningPaths.map((path, index) => (
                  <div key={path.title} className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-4 sm:grid-cols-[42px_1fr_auto] sm:items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{path.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{path.body}</p>
                    </div>
                    <Badge tone="slate">{path.progress}</Badge>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section id="labs" className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <SectionHeading
              eyebrow="Available labs"
              title="Practice modules"
              body="Each lab has a clear objective, local target URL, hints, flag submission, and post-solve explanation."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {challenges.map((challenge) => {
                const isSolved = completedSet.has(challenge.id);
                const status = statuses[challenge.id] ?? "checking";
                return (
                  <Link
                    key={challenge.id}
                    href={`/labs/${challenge.id}`}
                    className="group rounded-lg border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-300/40 hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5 text-cyan-100">
                        <FlaskConical className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <Badge tone={isSolved ? "green" : statusTone(status)}>
                        {isSolved ? "Solved" : statusLabel(status)}
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-cyan-100">{challenge.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{challenge.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="cyan">{challenge.category}</Badge>
                      <Badge tone="amber">{challenge.difficulty}</Badge>
                      <Badge tone="green">{challenge.time}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-white">Recent activity</h2>
              </div>
              <div className="mt-4 space-y-3">
                {recentAttempts.length ? (
                  recentAttempts.map((attempt) => {
                    const challenge = challenges.find((item) => item.id === attempt.challengeId);
                    return (
                      <div key={attempt.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{challenge?.title ?? attempt.challengeId}</p>
                          <p className="mt-1 text-xs text-slate-400">{new Date(attempt.submittedAt).toLocaleString()}</p>
                        </div>
                        <Badge tone={attempt.correct ? "green" : "red"}>{attempt.correct ? "Accepted" : "Retry"}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-400">
                    No activity yet. Open a lab, capture a flag, and submit it from the lab page.
                  </div>
                )}
              </div>
            </article>

            <article id="notes" className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-white">Student access</h2>
              </div>
              <StudentAccessPanel
                authMessage={authMessage}
                loginStudent={loginStudent}
                logoutStudent={logoutStudent}
                progressMode={progressMode}
                student={student}
              />
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}

function StudentAccessPanel({
  authMessage,
  loginStudent,
  logoutStudent,
  progressMode,
  student,
}: {
  authMessage: string;
  loginStudent: (input: { name: string; usn: string }) => Promise<void>;
  logoutStudent: () => Promise<void>;
  progressMode: "loading" | "backend" | "local";
  student: { name: string; usn: string; lastSeenAt: string } | null;
}) {
  const [name, setName] = useState("Pavan Kumar");
  const [usn, setUsn] = useState("4MH23IC033");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await loginStudent({ name, usn });
      setMessage("Signed in. Flag attempts will now update backend progress.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function submitLogout() {
    setBusy(true);
    setMessage("");
    try {
      await logoutStudent();
      setMessage("Signed out. The dashboard is back in local browser mode.");
    } catch {
      setMessage("Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  if (student) {
    return (
      <div id="settings" className="mt-4 space-y-3">
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
          <p className="text-sm font-semibold text-emerald-100">{student.name}</p>
          <p className="mt-1 text-xs text-slate-300">{student.usn || "No USN added"}</p>
          <p className="mt-3 text-xs text-slate-400">
            Last active: {new Date(student.lastSeenAt).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={submitLogout}
          disabled={busy}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Sign out
        </button>
        {(message || authMessage) ? (
          <p className="rounded-md border border-white/10 bg-slate-950/70 p-3 text-xs leading-5 text-slate-300">
            {message || authMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form id="settings" onSubmit={submitLogin} className="mt-4 space-y-3">
      <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-300">
        Mode: {progressMode === "loading" ? "Checking backend session" : "Local browser progress"}
      </div>
      <label className="block text-sm font-semibold text-slate-200" htmlFor="student-name">
        Student name
      </label>
      <input
        id="student-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300"
      />
      <label className="block text-sm font-semibold text-slate-200" htmlFor="student-usn">
        USN
      </label>
      <input
        id="student-usn"
        value={usn}
        onChange={(event) => setUsn(event.target.value)}
        className="min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300"
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Signing in..." : "Start backend progress"}
      </button>
      {(message || authMessage) ? (
        <p className="rounded-md border border-white/10 bg-slate-950/70 p-3 text-xs leading-5 text-slate-300">
          {message || authMessage}
        </p>
      ) : null}
    </form>
  );
}
