"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Flag,
  FlaskConical,
  NotebookPen,
  RefreshCcw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { challenges, type Challenge } from "@/data/challenges";
import { getTeachingModule, teachingFlow, teachingModules } from "@/data/teaching";
import { Badge, MetricCard, WorkspaceFrame, cn } from "./academy-ui";
import { statusLabel, statusTone, useLabStatusMap, type RuntimeState } from "./lab-status";
import { useLearningProgress } from "./progress";

const notesStorageKey = "vulnmentor-student-notes-v1";

const learningPaths = [
  {
    title: "Beginner Web Security",
    body: "Build the basics with browser-based vulnerabilities before moving deeper into API workflows.",
    labIds: ["web-sqli-login", "web-xss-comment"],
  },
  {
    title: "API Security Core",
    body: "Practice authorization, JWT trust boundaries, rate-limit thinking, and safe response design.",
    labIds: ["api-broken-auth", "api-jwt-tampering", "api-rate-limit-bypass", "api-excessive-data-exposure"],
  },
  {
    title: "Defender Thinking",
    body: "Read traces, explain root cause, compare secure code, and prepare clean mitigation notes.",
    labIds: challenges.map((challenge) => challenge.id),
  },
];

export function LabsDirectoryPage() {
  const { statuses, refresh } = useLabStatusMap(challenges);
  const { progress, student } = useLearningProgress(challenges);
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [query, setQuery] = useState("");
  const completedSet = new Set(progress.completed);

  const categories = useMemo(() => ["All", ...Array.from(new Set(challenges.map((challenge) => challenge.category)))], []);
  const difficulties = useMemo(() => ["All", ...Array.from(new Set(challenges.map((challenge) => challenge.difficulty)))], []);
  const filteredLabs = challenges.filter((challenge) => {
    const categoryMatch = category === "All" || challenge.category === category;
    const difficultyMatch = difficulty === "All" || challenge.difficulty === difficulty;
    const queryMatch = `${challenge.title} ${challenge.summary} ${challenge.category}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && difficultyMatch && queryMatch;
  });

  return (
    <WorkspaceFrame
      activeHref="/labs"
      badge="Lab directory"
      title="Browse Practical Labs"
      body="Open Web and API security labs, check Docker status, filter by topic, and continue from your current progress."
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
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="block text-sm font-semibold text-slate-200" htmlFor="lab-search">
            Search labs
            <div className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-slate-950 px-3 focus-within:border-cyan-300">
              <Search className="h-4 w-4 text-cyan-200" aria-hidden="true" />
              <input
                id="lab-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search SQL, JWT, IDOR..."
                className="min-h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </label>
          <FilterSelect label="Category" value={category} onChange={setCategory} options={categories} />
          <FilterSelect label="Difficulty" value={difficulty} onChange={setDifficulty} options={difficulties} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredLabs.map((challenge) => {
          const status = statuses[challenge.id] ?? "checking";
          const isSolved = completedSet.has(challenge.id);
          return (
            <LabCard key={challenge.id} challenge={challenge} status={status} isSolved={isSolved} />
          );
        })}
      </section>
    </WorkspaceFrame>
  );
}

export function LearningPathsPage() {
  const { progress, student } = useLearningProgress(challenges);
  const completedSet = new Set(progress.completed);

  return (
    <WorkspaceFrame
      activeHref="/learning-paths"
      badge="Structured roadmap"
      title="Learning Paths"
      body="Follow a clean beginner-to-intermediate path: learn the concept, practice safely, solve the lab, then explain the defense."
      showGuide={student?.role === "instructor"}
    >
      <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-100" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Teaching comes before flags</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Students should complete the teaching checklist before opening the target. This makes flag capture a result of understanding, not guessing.
            </p>
          </div>
          <Link
            href="/teaching"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Open Teaching Section
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {teachingFlow.map((step, index) => (
            <div key={step} className="rounded-md border border-white/10 bg-slate-950/70 p-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-300/10 text-xs font-semibold text-cyan-100">
                {index + 1}
              </span>
              <p className="mt-3 text-sm leading-5 text-slate-200">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        {learningPaths.map((path, index) => {
          const completedCount = path.labIds.filter((id) => completedSet.has(id)).length;
          const pathLabs = path.labIds
            .map((id) => challenges.find((challenge) => challenge.id === id))
            .filter((challenge): challenge is Challenge => Boolean(challenge));

          return (
            <article key={path.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="grid gap-4 lg:grid-cols-[56px_1fr_auto] lg:items-start">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-cyan-300/10 text-lg font-semibold text-cyan-100">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{path.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{path.body}</p>
                </div>
                <Badge tone={completedCount === path.labIds.length ? "green" : "cyan"}>
                  {completedCount}/{path.labIds.length} complete
                </Badge>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pathLabs.map((lab) => (
                  <Link key={lab.id} href={`/labs/${lab.id}`} className="rounded-lg border border-white/10 bg-slate-950/70 p-4 hover:border-cyan-300/40">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-white">{lab.title}</h3>
                      <Badge tone={completedSet.has(lab.id) ? "green" : "slate"}>
                        {completedSet.has(lab.id) ? "Done" : lab.difficulty}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{lab.summary}</p>
                    <p className="mt-3 text-xs leading-5 text-cyan-100">
                      Lesson: {getTeachingModule(lab.id)?.concept ?? "Guided teaching module"}
                    </p>
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-emerald-100" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-white">Recommended order</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {["SQL Injection", "Stored XSS", "API Authorization", "JWT Trust", "Rate Limiting", "Data Exposure", "Trace Review", "Secure Fixes"].map((step) => (
            <div key={step} className="rounded-md border border-white/10 bg-slate-950/70 p-3 text-sm font-semibold text-slate-200">
              {step}
            </div>
          ))}
        </div>
      </section>
    </WorkspaceFrame>
  );
}

export function TeachingPage() {
  const { progress, student } = useLearningProgress(challenges);
  const completedSet = new Set(progress.completed);

  return (
    <WorkspaceFrame
      activeHref="/teaching"
      badge="Teaching mode"
      title="Step-by-Step Teaching"
      body="Teach the concept first, guide observation, then let students solve the local lab and capture the flag with understanding."
      showGuide={student?.role === "instructor"}
    >
      <section className="grid gap-4 md:grid-cols-5">
        {teachingFlow.map((step, index) => (
          <article key={step} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-300/10 text-sm font-semibold text-cyan-100">
              {index + 1}
            </span>
            <p className="mt-3 text-sm leading-6 text-slate-200">{step}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5">
        {teachingModules.map((module, index) => {
          const challenge = challenges.find((item) => item.id === module.challengeId);
          if (!challenge) return null;
          const solved = completedSet.has(challenge.id);

          return (
            <article
              key={module.challengeId}
              id={module.challengeId}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="grid gap-4 lg:grid-cols-[56px_1fr_auto] lg:items-start">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-300/10 text-lg font-semibold text-emerald-100">
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="cyan">{challenge.category}</Badge>
                    <Badge tone="amber">{challenge.difficulty}</Badge>
                    <Badge tone={solved ? "green" : "slate"}>{solved ? "Solved" : "Practice pending"}</Badge>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">{module.concept}</h2>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{module.studentOutcome}</p>
                </div>
                <Link
                  href={`/labs/${challenge.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                >
                  Open Lab
                </Link>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
                <TeachingList title="Teach this concept" items={module.lesson} tone="cyan" />
                <TeachingList title="Guided local practice" items={module.guidedPractice} tone="green" />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <TeachingList title="Observe" items={module.observe} tone="slate" />
                <TeachingList title="Check yourself" items={module.checkYourself} tone="slate" />
                <TeachingList title="Common mistakes" items={module.commonMistakes} tone="amber" />
              </div>

              <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                <p className="text-sm font-semibold text-emerald-100">Defense takeaway</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{module.defenseTakeaway}</p>
              </div>
            </article>
          );
        })}
      </section>
    </WorkspaceFrame>
  );
}

export function ProgressPage() {
  const {
    accuracy,
    earnedPoints,
    progress,
    student,
    totalPoints,
    completion,
  } = useLearningProgress(challenges);
  const completedSet = new Set(progress.completed);

  return (
    <WorkspaceFrame
      activeHref="/progress"
      badge="Student progress"
      title="Progress Report"
      body="Review solved labs, attempts, score, accuracy, and remaining modules from one focused page."
      showGuide={student?.role === "instructor"}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Completion" value={`${completion}%`} helper={`${progress.completed.length}/${challenges.length} labs solved`} icon={Trophy} />
        <MetricCard label="Points" value={`${earnedPoints}/${totalPoints}`} helper="Score from solved labs" icon={Flag} />
        <MetricCard label="Accuracy" value={`${accuracy}%`} helper={`${progress.attempts.length} submissions`} icon={Target} />
        <MetricCard label="Remaining" value={`${challenges.length - progress.completed.length}`} helper="Labs left to solve" icon={Clock3} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-200" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Solved labs</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {challenges.map((challenge) => (
              <Link key={challenge.id} href={`/labs/${challenge.id}`} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-slate-950/70 p-3 hover:border-cyan-300/40">
                <div>
                  <p className="text-sm font-semibold text-white">{challenge.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{challenge.category} · {challenge.difficulty}</p>
                </div>
                <Badge tone={completedSet.has(challenge.id) ? "green" : "slate"}>
                  {completedSet.has(challenge.id) ? "Solved" : "Open"}
                </Badge>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-200" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Attempt history</h2>
          </div>
          <div className="mt-4 space-y-3">
            {progress.attempts.length ? (
              progress.attempts.slice(0, 12).map((attempt) => {
                const challenge = challenges.find((item) => item.id === attempt.challengeId);
                return (
                  <div key={attempt.id} className="rounded-md border border-white/10 bg-slate-950/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{challenge?.title ?? attempt.challengeId}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(attempt.submittedAt).toLocaleString()}</p>
                      </div>
                      <Badge tone={attempt.correct ? "green" : "red"}>{attempt.correct ? "Accepted" : "Retry"}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Submitted: {attempt.flagPreview}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-400">
                No attempts yet. Submit a flag from any lab to start building history.
              </div>
            )}
          </div>
        </article>
      </section>
    </WorkspaceFrame>
  );
}

export function NotesPage() {
  const { student } = useLearningProgress(challenges);
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadNotes = window.setTimeout(() => {
      setNotes(window.localStorage.getItem(notesStorageKey) ?? "");
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(loadNotes);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(notesStorageKey, notes);
  }, [loaded, notes]);

  return (
    <WorkspaceFrame
      activeHref="/notes"
      badge="Student notebook"
      title="Notes"
      body="Keep quick lab observations, payload ideas, root causes, and fix notes while practicing."
      showGuide={student?.role === "instructor"}
    >
      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <label className="flex items-center gap-2 text-xl font-semibold text-white" htmlFor="student-notes">
            <NotebookPen className="h-5 w-5 text-cyan-200" aria-hidden="true" />
            Practice notes
          </label>
          <textarea
            id="student-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Example: SQLi lab worked because raw username and password were joined into the query..."
            className="mt-4 min-h-[420px] w-full resize-y rounded-md border border-white/10 bg-slate-950 p-4 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
          />
          <p className="mt-3 text-xs text-slate-400">Notes are saved in this browser for your local practice session.</p>
        </article>

        <aside className="space-y-4">
          {["Payload tried", "Endpoint behavior", "Trace evidence", "Root cause", "Secure fix"].map((prompt) => (
            <div key={prompt} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm font-semibold text-white">{prompt}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Use this as a heading when writing clean lab notes.</p>
            </div>
          ))}
        </aside>
      </section>
    </WorkspaceFrame>
  );
}

export function SettingsPage() {
  const {
    authMessage,
    logoutStudent,
    progressMode,
    resetLocalProgress,
    student,
  } = useLearningProgress(challenges);

  async function submitLogout() {
    await logoutStudent();
    window.location.href = "/login";
  }

  function resetBrowserProgress() {
    if (!window.confirm("Reset browser-only fallback progress on this device?")) return;
    resetLocalProgress();
  }

  return (
    <WorkspaceFrame
      activeHref="/settings"
      badge="Account settings"
      title="Settings"
      body="Manage account access, local progress behavior, and useful sandbox reset commands."
      showGuide={student?.role === "instructor"}
    >
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-cyan-200" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Account</h2>
          </div>
          {student ? (
            <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">{student.name}</p>
              <p className="mt-1 text-xs text-slate-300">{student.email}</p>
              <p className="mt-1 text-xs text-slate-300">{student.role}</p>
              <p className="mt-3 text-xs text-slate-400">Last active: {new Date(student.lastSeenAt).toLocaleString()}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-400">
              Checking account session...
            </div>
          )}
          <button
            type="button"
            onClick={submitLogout}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
          >
            Sign out
          </button>
          {authMessage ? (
            <p className="mt-4 rounded-md border border-white/10 bg-slate-950/70 p-3 text-xs leading-5 text-slate-300">{authMessage}</p>
          ) : null}
        </article>

        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-200" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Workspace behavior</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm font-semibold text-white">Progress mode</p>
              <p className="mt-1 text-sm text-slate-300">{progressMode === "backend" ? "Account database" : progressMode === "loading" ? "Checking session" : "Browser fallback"}</p>
            </div>
            <button
              type="button"
              onClick={resetBrowserProgress}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-red-300/25 bg-red-400/10 px-4 text-sm font-semibold text-red-100 hover:bg-red-400/15"
            >
              Reset browser fallback progress
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan-100" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-white">Common lab reset commands</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "docker compose restart sql-injection-login",
            "docker compose restart stored-xss-comment",
            "docker compose restart api-broken-auth",
            "docker compose restart api-jwt-tampering",
            "docker compose restart api-rate-limit-bypass",
            "docker compose restart api-excessive-data-exposure",
          ].map((command) => (
            <code key={command} className="overflow-x-auto rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-xs text-emerald-200">
              {command}
            </code>
          ))}
        </div>
      </section>
    </WorkspaceFrame>
  );
}

function TeachingList({
  items,
  title,
  tone,
}: {
  items: string[];
  title: string;
  tone: "amber" | "cyan" | "green" | "slate";
}) {
  const toneClass = {
    amber: "border-amber-300/20 bg-amber-300/10",
    cyan: "border-cyan-300/20 bg-cyan-300/10",
    green: "border-emerald-300/20 bg-emerald-300/10",
    slate: "border-white/10 bg-slate-950/70",
  }[tone];

  return (
    <article className={cn("rounded-lg border p-4", toneClass)}>
      <h3 className="font-semibold text-white">{title}</h3>
      <ol className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={item} className="grid grid-cols-[28px_1fr] gap-3 text-sm leading-6 text-slate-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950/80 text-xs font-semibold text-cyan-100">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-200">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300 lg:w-48"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function LabCard({
  challenge,
  isSolved,
  status,
}: {
  challenge: Challenge;
  isSolved: boolean;
  status: RuntimeState;
}) {
  return (
    <Link
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
      <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-cyan-100">{challenge.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{challenge.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="cyan">{challenge.category}</Badge>
        <Badge tone="amber">{challenge.difficulty}</Badge>
        <Badge tone="green">{challenge.time}</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-semibold text-cyan-200">
        Open lab
        <ArrowRight className={cn("h-4 w-4 transition", "group-hover:translate-x-1")} aria-hidden="true" />
      </div>
    </Link>
  );
}
