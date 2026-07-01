"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Code2, ExternalLink, Flag, HelpCircle, Lightbulb, RefreshCcw, ShieldCheck, Target, TerminalSquare } from "lucide-react";
import type { Challenge } from "@/data/challenges";
import { challenges } from "@/data/challenges";
import { getNextTeachingLesson, getTeachingLesson, getTeachingModule } from "@/data/teaching";
import { AcademyTopNav, Badge, cn } from "./academy-ui";
import { statusLabel, statusTone, useLabStatus } from "./lab-status";
import { useLearningProgress } from "./progress";
import type { ProgressState } from "@/lib/progress-types";

type VerifyFlagResponse = {
  ok: boolean;
  correct?: boolean;
  message?: string;
  progress: ProgressState | null;
};

export function LabDetailPage({ challenge }: { challenge: Challenge }) {
  const [hintCount, setHintCount] = useState(0);
  const [flagValue, setFlagValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { status, lastChecked, refresh } = useLabStatus(challenge.lab);
  const { progress, student, applyProgress } = useLearningProgress(challenges);
  const isSolved = progress.completed.includes(challenge.id);
  const teachingModule = getTeachingModule(challenge.id);
  const teachingLesson = getTeachingLesson(challenge.teaching.lessonSlug);
  const nextTeachingLesson = teachingLesson ? getNextTeachingLesson(teachingLesson.slug) : undefined;
  const relatedLabs = useMemo(
    () => challenges.filter((item) => item.category === challenge.category && item.id !== challenge.id).slice(0, 3),
    [challenge],
  );

  function revealHint() {
    setHintCount((count) => Math.min(count + 1, challenge.hints.length));
  }

  async function submitFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedFlag = flagValue.trim();
    if (!submittedFlag) {
      setFeedback("Enter the captured flag before submitting.");
      return;
    }

    setSubmitting(true);
    setFeedback("");
    try {
      const response = await fetch("/api/flags/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.verifierId,
          flag: submittedFlag,
        }),
      });
      const result = (await response.json()) as VerifyFlagResponse;

      if (!response.ok || !result.ok) {
        setFeedback(result.message ?? "Sign in again before submitting flags.");
        return;
      }

      if (result.progress) {
        applyProgress(result.progress);
      }
      setFeedback(result.message ?? "Flag checked.");
      if (result.correct) setFlagValue("");
    } catch {
      setFeedback("Could not verify the flag. Check the portal server and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AcademyTopNav />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/labs" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to labs
        </Link>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <header className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap gap-2">
                <Badge tone="cyan">{challenge.category}</Badge>
                <Badge tone="amber">{challenge.difficulty}</Badge>
                <Badge tone="green">{challenge.time}</Badge>
                <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
                <Badge tone={student ? "green" : "slate"}>
                  {student ? "Account progress" : "Sign in required"}
                </Badge>
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-5xl">{challenge.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{challenge.summary}</p>
              {teachingLesson ? (
                <Link
                  href={`/teaching/${teachingLesson.slug}`}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                >
                  Learn first
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InfoPill icon={Target} label="Objective" value={challenge.workflow[0]} />
                <InfoPill icon={Flag} label="Reward" value={`${challenge.points} points`} />
                <InfoPill icon={Clock3} label="Estimate" value={challenge.time} />
              </div>
            </header>

            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                  <h2 className="text-xl font-semibold text-white">What you will learn</h2>
                </div>
                <div className="mt-4 grid gap-2">
                  {challenge.skills.map((skill) => (
                    <div key={skill} className="rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
                      {skill}
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                  <h2 className="text-xl font-semibold text-white">Scenario</h2>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  You are practicing inside a local VulnMentor sandbox. Study the target behavior, use the hints only when needed,
                  capture the flag from the lab, and submit it here to unlock the explanation.
                </p>
                <div className="mt-5 grid gap-2">
                  {challenge.workflow.map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-md border border-white/10 bg-slate-950/70 p-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-300/10 text-xs font-semibold text-cyan-100">
                        {index + 1}
                      </span>
                      <p className="text-sm text-slate-200">{step}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            {teachingModule ? (
              <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-cyan-100" aria-hidden="true" />
                      <h2 className="text-xl font-semibold text-white">Learn Before You Solve</h2>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{teachingModule.studentOutcome}</p>
                  </div>
                  <Link
                    href={`/teaching/${challenge.teaching.lessonSlug}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Full lesson
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <LessonSteps title="Core idea" items={teachingModule.lesson} />
                  <LessonSteps title="Step-by-step local practice" items={teachingModule.guidedPractice} />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <CompactLesson title="Observe" items={teachingModule.observe} />
                  <CompactLesson title="Check yourself" items={teachingModule.checkYourself} />
                  <CompactLesson title="Avoid these mistakes" items={teachingModule.commonMistakes} />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <IntroLessonCard title="Beginner explanation" body={challenge.teaching.beginnerIntro.what} />
                  <IntroLessonCard title="What creates the vulnerability?" body={challenge.teaching.beginnerIntro.developerMistake} />
                  <IntroLessonCard title="Normal feature" body={challenge.teaching.beginnerIntro.normalFeature} />
                  <IntroLessonCard title="Why it matters" body={challenge.teaching.beginnerIntro.why} />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                  <LessonSteps title="Prerequisites" items={challenge.teaching.prerequisites} />
                  <LessonSteps title="Testing methodology" items={challenge.teaching.methodology} />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <CompactLesson title="Evidence checklist" items={challenge.teaching.evidenceChecklist} />
                  <ReportNoteCard template={challenge.teaching.reportTemplate} />
                  <CompactLesson title="Common mistakes" items={challenge.teaching.commonMistakes} />
                </div>

                {nextTeachingLesson ? (
                  <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                    <p className="text-sm font-semibold text-emerald-100">Next lesson recommendation</p>
                    <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{nextTeachingLesson.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-300">{nextTeachingLesson.summary}</p>
                      </div>
                      <Link
                        href={`/teaching/${nextTeachingLesson.slug}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                      >
                        Continue
                      </Link>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Start Lab</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Run Docker locally, then open the target in a new tab.</p>
                </div>
                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  Refresh status
                </button>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Target URL</p>
                  <code className="mt-2 block overflow-x-auto rounded-md bg-slate-950 px-3 py-3 text-sm text-emerald-200">
                    {challenge.lab?.baseUrl ?? "Planned lab target"}
                  </code>
                  <p className="mt-2 text-xs text-slate-400">
                    Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : "waiting for first check"}
                  </p>
                </div>
                {challenge.lab ? (
                  <a
                    href={challenge.lab.baseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                  >
                    Open Target
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-200" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-white">Hints</h2>
                  </div>
                  <button
                    type="button"
                    onClick={revealHint}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                    disabled={hintCount >= challenge.hints.length}
                  >
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                    Reveal Hint
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {challenge.hints.map((hint, index) => {
                    const unlocked = index < hintCount;
                    return (
                      <div
                        key={hint.title}
                        className={cn(
                          "rounded-lg border p-4",
                          unlocked ? "border-amber-300/25 bg-amber-300/10" : "border-white/10 bg-slate-950/70",
                        )}
                      >
                        <p className="font-semibold text-white">{hint.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {unlocked ? hint.body : "Locked until you reveal this hint."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-emerald-200" aria-hidden="true" />
                  <h2 className="text-xl font-semibold text-white">Submit Flag</h2>
                </div>
                <form onSubmit={submitFlag} className="mt-4 space-y-3">
                  <label className="block text-sm font-semibold text-slate-200" htmlFor="flag">
                    Captured flag
                  </label>
                  <input
                    id="flag"
                    value={flagValue}
                    onChange={(event) => setFlagValue(event.target.value)}
                    placeholder="VM{...}"
                    className="min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Checking..." : "Submit Flag"}
                  </button>
                </form>
                {feedback ? (
                  <p className="mt-4 rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-200">{feedback}</p>
                ) : null}
                {!student ? (
                  <p className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-xs leading-5 text-slate-300">
                    Sign in to submit flags and store progress with your account.
                  </p>
                ) : null}
                {isSolved ? (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Completed
                  </div>
                ) : null}
              </article>
            </section>

            <SecureComparisonSection challenge={challenge} />

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-white">Explanation after completion</h2>
              </div>
              {isSolved ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-white">Root cause</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{challenge.rootCause}</p>
                    <h3 className="mt-5 font-semibold text-white">Impact</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{challenge.impact}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Mitigation checklist</h3>
                    <ul className="mt-2 space-y-2">
                      {challenge.mitigation.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-dashed border-white/15 p-5 text-sm leading-7 text-slate-400">
                  Capture and submit the correct flag to unlock the root cause, impact, and mitigation explanation.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold text-white">Lab checklist</h2>
              <div className="mt-4 space-y-3">
                {["Learn first", "Read scenario", "Collect evidence", "Submit flag", "Compare secure code"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-md bg-slate-950/70 p-3 text-sm text-slate-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-300/10 text-xs font-semibold text-cyan-100">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold text-white">Related labs</h2>
              <div className="mt-4 space-y-3">
                {relatedLabs.map((lab) => (
                  <Link key={lab.id} href={`/labs/${lab.id}`} className="block rounded-md border border-white/10 bg-slate-950/70 p-3 hover:border-cyan-300/40">
                    <p className="text-sm font-semibold text-white">{lab.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{lab.difficulty} · {lab.time}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-red-300/20 bg-red-400/10 p-5">
              <h2 className="text-lg font-semibold text-red-100">Safety boundary</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Use these techniques only inside VulnMentor localhost labs or environments where you have written permission.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function LessonSteps({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h3 className="font-semibold text-white">{title}</h3>
      <ol className="mt-3 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="grid grid-cols-[30px_1fr] gap-3 text-sm leading-6 text-slate-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-300/10 text-xs font-semibold text-cyan-100">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function CompactLesson({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-5 text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function IntroLessonCard({
  body,
  title,
}: {
  body: string;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </article>
  );
}

function ReportNoteCard({ template }: { template: string }) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h3 className="text-sm font-semibold text-white">Report note template</h3>
      <p className="mt-3 text-xs leading-6 text-slate-300">{template}</p>
    </article>
  );
}

function SecureComparisonSection({ challenge }: { challenge: Challenge }) {
  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-cyan-100" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Vulnerable vs Secure Comparison</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Compare the unsafe pattern with the defensive implementation. This section is available for every lab so students learn the fix, not only the attack path.
          </p>
        </div>
        <Badge tone="green">Defense view</Badge>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <CodePanel
          title="Vulnerable pattern"
          tone="red"
          body={challenge.code.vulnerable}
          caption="The application trusts input, claims, object IDs, or response fields too early."
        />
        <CodePanel
          title="Secure version"
          tone="green"
          body={challenge.code.secure}
          caption="The fixed version validates, authorizes, verifies, encodes, filters, or rate-limits on the server side."
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
          <h3 className="font-semibold text-white">What changed?</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">{challenge.rootCause}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
          <h3 className="font-semibold text-white">Secure coding checklist</h3>
          <ul className="mt-3 space-y-2">
            {challenge.mitigation.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CodePanel({
  body,
  caption,
  title,
  tone,
}: {
  body: string;
  caption: string;
  title: string;
  tone: "green" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
      : "border-red-300/25 bg-red-400/10 text-red-100";

  return (
    <article className="min-w-0 rounded-lg border border-white/10 bg-slate-950/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-white">{title}</h3>
        <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", toneClass)}>
          {tone === "green" ? "Fixed" : "Risk"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{caption}</p>
      <pre className="mt-4 max-h-[360px] overflow-auto rounded-md border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        <code>{body}</code>
      </pre>
    </article>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
        <Icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
