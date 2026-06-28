"use client";

import Link from "next/link";
import { Activity, ArrowRight, Database, Flag, RefreshCcw, Route, ShieldCheck, Signal, Target, Trophy } from "lucide-react";
import { challenges } from "@/data/challenges";
import { Badge, MetricCard, WorkspaceFrame } from "./academy-ui";
import { statusLabel, statusTone, useLabStatusMap } from "./lab-status";
import { useLearningProgress } from "./progress";

const learningPathPreview = [
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
    student,
    completion,
    earnedPoints,
    totalPoints,
    accuracy,
  } = useLearningProgress(challenges);
  const completedSet = new Set(progress.completed);
  const nextLab = challenges.find((challenge) => !completedSet.has(challenge.id)) ?? challenges[0];
  const recentAttempts = progress.attempts.slice(0, 4);
  const onlineCount = challenges.filter((challenge) => statuses[challenge.id] === "online").length;

  return (
    <WorkspaceFrame
      activeHref="/dashboard"
      badge={student ? "Account progress active" : "Academy dashboard"}
      badgeTone={student ? "green" : "cyan"}
      title="Welcome back to VulnMentor"
      body={
        student
          ? `${student.name}, your progress is tied to this account.`
          : "Continue your Web and API security path, monitor local lab status, and keep your project progress in one place."
      }
      showGuide={student?.role === "instructor"}
      action={
        <button
          type="button"
          onClick={refresh}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 md:w-auto"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Refresh labs
        </button>
      }
    >
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Progress" value={`${completion}%`} helper={`${progress.completed.length}/${challenges.length} labs solved`} icon={Trophy} />
        <MetricCard label="Points" value={`${earnedPoints}/${totalPoints}`} helper="Local demo score" icon={Flag} />
        <MetricCard label="Accuracy" value={`${accuracy}%`} helper={`${progress.attempts.length} flag attempts`} icon={Target} />
        <MetricCard
          label={student ? "Progress store" : "Lab status"}
          value={student ? "Account" : `${onlineCount}/${challenges.length}`}
          helper={student ? "Local account database" : "Docker targets online"}
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

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Learning Paths</h2>
            </div>
            <Link href="/learning-paths" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {learningPathPreview.map((path, index) => (
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

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Recent activity</h2>
            </div>
            <Link href="/progress" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
              View progress
            </Link>
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

        <article className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-cyan-100" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Workspace pages</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              ["Browse labs", "/labs"],
              ["Track progress", "/progress"],
              ["Write notes", "/notes"],
              ["Manage settings", "/settings"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="flex min-h-11 items-center justify-between rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm font-semibold text-slate-200 hover:border-cyan-300/40">
                {label}
                <ArrowRight className="h-4 w-4 text-cyan-200" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </article>
      </section>
    </WorkspaceFrame>
  );
}
