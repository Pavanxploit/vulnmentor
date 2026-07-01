"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookMarked,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Download,
  FileJson,
  Flag,
  FlaskConical,
  ListChecks,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  Users,
} from "lucide-react";
import { challenges, type Challenge } from "@/data/challenges";
import { Badge, DashboardSidebar, MetricCard, SectionHeading, cn } from "./academy-ui";

const allCategories = ["All categories", ...Array.from(new Set(challenges.map((challenge) => challenge.category)))] as const;
const allDifficulties = ["All difficulty", "Easy", "Medium", "Hard"] as const;

const checklistItems = [
  "Safe localhost target",
  "Progressive hints",
  "Verifier ID mapped",
  "Secure code comparison",
  "Docker service linked",
  "Trace endpoint ready",
];

type InstructorAnalytics = {
  totalStudents: number;
  activeStudents: number;
  labCompletionPercentage: number;
  mostFailedLabs: Array<{ challengeId: string; failures: number }>;
  mostUsedHints: Array<{ challengeId: string; hints: number }>;
  averageQuizScore: number;
  recentAttempts: Array<{
    id: string;
    userId: string;
    challengeId: string;
    correct: boolean;
    flagPreview: string;
    submittedAt: string;
  }>;
  studentRows: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    lastSeenAt: string;
    completedLabs: number;
    attempts: number;
    accuracy: number;
    averageQuizScore: number;
  }>;
};

export function GuideConsolePage() {
  const [category, setCategory] = useState("All categories");
  const [difficulty, setDifficulty] = useState("All difficulty");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(challenges[0]?.id ?? "");
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [analyticsMessage, setAnalyticsMessage] = useState("Loading instructor analytics...");

  useEffect(() => {
    let cancelled = false;
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/instructor/analytics", { cache: "no-store" });
        const result = (await response.json()) as {
          ok: boolean;
          message?: string;
          analytics?: InstructorAnalytics;
        };
        if (cancelled) return;
        if (!response.ok || !result.ok || !result.analytics) {
          setAnalyticsMessage(result.message ?? "Could not load instructor analytics.");
          return;
        }
        setAnalytics(result.analytics);
        setAnalyticsMessage("");
      } catch {
        if (!cancelled) setAnalyticsMessage("Could not load instructor analytics.");
      }
    }
    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredChallenges = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return challenges.filter((challenge) => {
      const matchesCategory = category === "All categories" || challenge.category === category;
      const matchesDifficulty = difficulty === "All difficulty" || challenge.difficulty === difficulty;
      const matchesQuery =
        !normalizedQuery ||
        [challenge.title, challenge.id, challenge.verifierId, challenge.category, challenge.summary]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesDifficulty && matchesQuery;
    });
  }, [category, difficulty, query]);

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedId) ?? filteredChallenges[0] ?? challenges[0];
  const totalPoints = challenges.reduce((sum, challenge) => sum + challenge.points, 0);
  const dockerLabCount = challenges.filter((challenge) => Boolean(challenge.lab)).length;
  const secureComparisonCount = challenges.filter(
    (challenge) => Boolean(challenge.code.vulnerable && challenge.code.secure),
  ).length;
  const skillCount = new Set(challenges.flatMap((challenge) => challenge.skills)).size;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-[1500px] min-w-0 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <DashboardSidebar activeHref="/guide" showGuide />

        <section className="min-w-0 space-y-5">
          <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <Badge tone="cyan">Guide console</Badge>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Instructor Guide Console</h1>
              <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-300">
                Review lab readiness, verifier mapping, Docker targets, learning coverage, and secure-code evidence before a demo or class session.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
              >
                Dashboard
              </Link>
              <Link
                href={selectedChallenge ? `/labs/${selectedChallenge.id}` : "/labs"}
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
              >
                Open Selected Lab
              </Link>
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Live labs" value={`${dockerLabCount}/${challenges.length}`} helper="Docker-backed targets" icon={FlaskConical} />
            <MetricCard label="Total points" value={`${totalPoints}`} helper="CTF score pool" icon={Trophy} />
            <MetricCard label="Secure coverage" value={`${secureComparisonCount}/${challenges.length}`} helper="Vulnerable vs secure code" icon={ShieldCheck} />
            <MetricCard label="Skill tags" value={`${skillCount}`} helper="Mapped learning outcomes" icon={BookMarked} />
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Total students" value={`${analytics?.totalStudents ?? 0}`} helper="Registered student accounts" icon={Users} />
            <MetricCard label="Active students" value={`${analytics?.activeStudents ?? 0}`} helper="Seen in last 7 days" icon={Activity} />
            <MetricCard label="Lab completion" value={`${analytics?.labCompletionPercentage ?? 0}%`} helper="Across all student accounts" icon={BarChart3} />
            <MetricCard label="Avg quiz score" value={`${analytics?.averageQuizScore ?? 0}%`} helper="Saved lesson assessments" icon={ClipboardCheck} />
          </section>

          <InstructorAnalyticsPanel
            analytics={analytics}
            message={analyticsMessage}
          />

          <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeading
                  eyebrow="Catalog"
                  title="Lab Readiness Board"
                  body="Select a lab to inspect its authoring data, runtime target, points, verifier, and guide checklist."
                />
                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[560px]">
                  <label className="min-w-0 text-sm font-semibold text-slate-200">
                    <span className="mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                      Search
                    </span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="min-h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300"
                      placeholder="Lab, id, topic"
                    />
                  </label>
                  <label className="min-w-0 text-sm font-semibold text-slate-200">
                    <span className="mb-2 flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                      Category
                    </span>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="min-h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300"
                    >
                      {allCategories.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="min-w-0 text-sm font-semibold text-slate-200">
                    <span className="mb-2 flex items-center gap-2">
                      <Flag className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                      Difficulty
                    </span>
                    <select
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                      className="min-h-10 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300"
                    >
                      {allDifficulties.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-[820px] table-fixed border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase text-slate-400">
                      <th className="w-[32%] px-3 py-3 font-semibold">Challenge</th>
                      <th className="w-[16%] px-3 py-3 font-semibold">Track</th>
                      <th className="w-[12%] px-3 py-3 font-semibold">Level</th>
                      <th className="w-[14%] px-3 py-3 font-semibold">Runtime</th>
                      <th className="w-[13%] px-3 py-3 font-semibold">Verifier</th>
                      <th className="w-[13%] px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChallenges.map((challenge) => (
                      <tr
                        key={challenge.id}
                        className={cn(
                          "border-b border-white/10 align-top transition",
                          selectedChallenge?.id === challenge.id ? "bg-cyan-300/10" : "hover:bg-white/[0.03]",
                        )}
                      >
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedId(challenge.id)}
                            className="text-left font-semibold text-white hover:text-cyan-100"
                          >
                            {challenge.title}
                          </button>
                          <p className="mt-1 break-words font-mono text-xs text-slate-500">{challenge.id}</p>
                        </td>
                        <td className="px-3 py-4">
                          <Badge tone={challenge.category.includes("API") ? "cyan" : "green"}>{challenge.category}</Badge>
                        </td>
                        <td className="px-3 py-4">
                          <Badge tone={challenge.difficulty === "Easy" ? "green" : challenge.difficulty === "Medium" ? "amber" : "red"}>
                            {challenge.difficulty}
                          </Badge>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-mono text-xs text-slate-300">{getRuntimeLabel(challenge)}</p>
                          <p className="mt-1 text-xs text-slate-500">{challenge.lab?.serviceName ?? "Planned"}</p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="break-words font-mono text-xs text-slate-300">{challenge.verifierId}</p>
                          <p className="mt-1 text-xs text-slate-500">{challenge.points} pts</p>
                        </td>
                        <td className="px-3 py-4">
                          <Badge tone={challenge.status === "available" ? "green" : "slate"}>{challenge.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredChallenges.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-400">
                  No lab matches the current filters.
                </div>
              ) : null}
            </article>

            <SelectedChallengePanel challenge={selectedChallenge} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-white">Guide Review Checklist</h2>
              </div>
              <div className="mt-4 grid gap-3">
                {checklistItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                    <p className="text-sm font-medium text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-white">Authoring Snapshot</h2>
              </div>
              <pre className="mt-4 max-h-[330px] overflow-auto rounded-lg border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-200">
                <code>{JSON.stringify(createAuthoringSnapshot(selectedChallenge), null, 2)}</code>
              </pre>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}

function SelectedChallengePanel({ challenge }: { challenge: Challenge }) {
  return (
    <aside className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone="green">Selected lab</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-white">{challenge.title}</h2>
        </div>
        <Badge tone="amber">{challenge.points} pts</Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-200">{challenge.summary}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoTile label="Verifier" value={challenge.verifierId} />
        <InfoTile label="Service" value={challenge.lab?.serviceName ?? "Planned"} />
        <InfoTile label="Base URL" value={challenge.lab?.baseUrl ?? "Not assigned"} />
        <InfoTile label="Trace URL" value={challenge.lab?.tracesUrl ?? "Not assigned"} />
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/70 p-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-cyan-200" aria-hidden="true" />
          <h3 className="font-semibold text-white">Learning workflow</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {challenge.workflow.map((item) => (
            <Badge key={item} tone="slate">
              {item}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/70 p-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-cyan-200" aria-hidden="true" />
          <h3 className="font-semibold text-white">Evidence coverage</h3>
        </div>
        <div className="mt-3 grid gap-2">
          <CoverageRow label="Hints" value={`${challenge.hints.length} levels`} ready={challenge.hints.length >= 3} />
          <CoverageRow label="Secure fix" value={challenge.code.secure ? "Present" : "Missing"} ready={Boolean(challenge.code.secure)} />
          <CoverageRow label="Root cause" value={challenge.rootCause ? "Present" : "Missing"} ready={Boolean(challenge.rootCause)} />
          <CoverageRow label="Mitigations" value={`${challenge.mitigation.length} notes`} ready={challenge.mitigation.length >= 3} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {challenge.skills.map((skill) => (
          <Badge key={skill} tone="cyan">
            {skill}
          </Badge>
        ))}
      </div>
    </aside>
  );
}

function InstructorAnalyticsPanel({
  analytics,
  message,
}: {
  analytics: InstructorAnalytics | null;
  message: string;
}) {
  function exportJson() {
    if (!analytics) return;
    downloadText("vulnmentor-instructor-report.json", JSON.stringify(analytics, null, 2));
  }

  function exportCsv() {
    if (!analytics) return;
    const rows = [
      ["name", "email", "completed_labs", "attempts", "accuracy", "average_quiz_score", "last_seen_at"],
      ...analytics.studentRows.map((row) => [
        row.name,
        row.email,
        String(row.completedLabs),
        String(row.attempts),
        `${row.accuracy}%`,
        `${row.averageQuizScore}%`,
        row.lastSeenAt,
      ]),
    ];
    downloadText("vulnmentor-instructor-report.csv", rows.map((row) => row.map(csvEscape).join(",")).join("\n"));
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-200" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Instructor Analytics</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Student-wise progress, recent attempts, failed labs, quiz score, and exportable classroom reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={!analytics}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            onClick={exportJson}
            disabled={!analytics}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            JSON
          </button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">{message}</p>
      ) : null}

      {analytics ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="overflow-x-auto">
            <table className="min-w-[780px] table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-slate-400">
                  <th className="w-[28%] px-3 py-3 font-semibold">Student</th>
                  <th className="w-[14%] px-3 py-3 font-semibold">Progress</th>
                  <th className="w-[14%] px-3 py-3 font-semibold">Attempts</th>
                  <th className="w-[14%] px-3 py-3 font-semibold">Accuracy</th>
                  <th className="w-[14%] px-3 py-3 font-semibold">Quiz</th>
                  <th className="w-[16%] px-3 py-3 font-semibold">Last active</th>
                </tr>
              </thead>
              <tbody>
                {analytics.studentRows.length ? (
                  analytics.studentRows.map((row) => (
                    <tr key={row.id} className="border-b border-white/10 align-top hover:bg-white/[0.03]">
                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">{row.name}</p>
                        <p className="mt-1 break-words text-xs text-slate-500">{row.email}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-200">{row.completedLabs}/6</td>
                      <td className="px-3 py-4 text-slate-200">{row.attempts}</td>
                      <td className="px-3 py-4 text-slate-200">{row.accuracy}%</td>
                      <td className="px-3 py-4 text-slate-200">{row.averageQuizScore}%</td>
                      <td className="px-3 py-4 text-xs text-slate-400">{new Date(row.lastSeenAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-5 text-sm text-slate-400">
                      No student accounts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <aside className="space-y-4">
            <AnalyticsList
              title="Most failed labs"
              empty="No failed attempts yet."
              items={analytics.mostFailedLabs.map((item) => ({
                title: challenges.find((challenge) => challenge.id === item.challengeId)?.title ?? item.challengeId,
                value: `${item.failures} failed attempts`,
              }))}
            />
            <AnalyticsList
              title="Most used hints"
              empty="No hint usage recorded yet."
              items={analytics.mostUsedHints.map((item) => ({
                title: challenges.find((challenge) => challenge.id === item.challengeId)?.title ?? item.challengeId,
                value: `${item.hints} hint views`,
              }))}
            />
            <AnalyticsList
              title="Recent attempts"
              empty="No attempts yet."
              items={analytics.recentAttempts.slice(0, 5).map((item) => ({
                title: challenges.find((challenge) => challenge.id === item.challengeId)?.title ?? item.challengeId,
                value: `${item.correct ? "Accepted" : "Retry"} at ${new Date(item.submittedAt).toLocaleTimeString()}`,
              }))}
            />
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function AnalyticsList({
  empty,
  items,
  title,
}: {
  empty: string;
  items: Array<{ title: string; value: string }>;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={`${item.title}-${item.value}`} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <p className="text-sm font-semibold text-slate-200">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">{item.value}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">{empty}</p>
        )}
      </div>
    </article>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-slate-950/70 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-2 break-words font-mono text-xs text-slate-200">{value}</p>
    </div>
  );
}

function downloadText(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function CoverageRow({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-300">{label}</span>
      <span className={cn("font-medium", ready ? "text-emerald-200" : "text-amber-200")}>{value}</span>
    </div>
  );
}

function getRuntimeLabel(challenge: Challenge) {
  if (!challenge.lab) return "No runtime";

  try {
    const url = new URL(challenge.lab.baseUrl);
    return `port ${url.port}`;
  } catch {
    return challenge.lab.baseUrl;
  }
}

function createAuthoringSnapshot(challenge: Challenge) {
  return {
    id: challenge.id,
    title: challenge.title,
    category: challenge.category,
    difficulty: challenge.difficulty,
    verifierId: challenge.verifierId,
    points: challenge.points,
    lab: {
      serviceName: challenge.lab?.serviceName ?? null,
      baseUrl: challenge.lab?.baseUrl ?? null,
      healthUrl: challenge.lab?.healthUrl ?? null,
      tracesUrl: challenge.lab?.tracesUrl ?? null,
    },
    coverage: {
      hints: challenge.hints.length,
      workflowSteps: challenge.workflow.length,
      mitigations: challenge.mitigation.length,
      hasSecureCode: Boolean(challenge.code.secure),
    },
  };
}
