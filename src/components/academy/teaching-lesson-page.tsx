"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Code2,
  ExternalLink,
  FileText,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import type { TeachingLesson } from "@/data/teaching";
import { Badge, WorkspaceFrame, cn } from "./academy-ui";

type TeachingLessonPageProps = {
  lesson: TeachingLesson;
  nextLesson?: TeachingLesson;
};

const lessonAnchors = [
  { id: "what", label: "What" },
  { id: "why", label: "Why" },
  { id: "how", label: "How" },
  { id: "fix", label: "Fix" },
  { id: "quiz", label: "Quiz" },
  { id: "report", label: "Report" },
];

export function TeachingLessonPage({ lesson, nextLesson }: TeachingLessonPageProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const relatedLab = lesson.relatedLab;

  return (
    <WorkspaceFrame
      activeHref="/teaching"
      badge={lesson.track}
      title={lesson.title}
      body={lesson.summary}
      action={
        <Link
          href="/teaching"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Teaching Hub
        </Link>
      }
    >
      <section className="grid gap-5 xl:grid-cols-[1fr_310px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-lg border border-red-300/20 bg-red-400/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-red-100" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-semibold text-red-100">Use Only in VulnMentor Local Labs</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This lesson teaches safe testing inside your local Docker sandbox. Do not test real websites, third-party APIs, college systems, or any system without written permission.
                </p>
              </div>
            </div>
          </section>

          <section id="what" className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone={lesson.kind === "foundation" ? "cyan" : "green"}>{lesson.status}</Badge>
              <Badge tone="amber">{lesson.difficulty}</Badge>
              <Badge tone="cyan">{lesson.time}</Badge>
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-white">Beginner Introduction</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <IntroCard title="What is it?" body={lesson.beginnerIntro.what} tone="cyan" />
              <IntroCard title="Why should I care?" body={lesson.beginnerIntro.why} tone="green" />
              <IntroCard title="Where does it happen?" body={lesson.beginnerIntro.where} tone="slate" />
              <IntroCard title="Normal feature" body={lesson.beginnerIntro.normalFeature} tone="slate" />
              <IntroCard title="Developer mistake" body={lesson.beginnerIntro.developerMistake} tone="red" wide />
            </div>
          </section>

          <section id="why" className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-cyan-100" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Mental Model</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lesson.mentalModel.map((step, index) => (
                <article key={`${step}-${index}`} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{step}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <TeachingList title="Prerequisites" items={lesson.prerequisites} icon={Lightbulb} tone="amber" />
            <TeachingList title="Safe Testing Methodology" items={lesson.methodology} icon={ListChecks} tone="green" ordered />
          </section>

          <section id="how" className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Vulnerable Code Walkthrough</h2>
            </div>
            {lesson.vulnerableCode ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <CodeBlock title="Vulnerable code" body={lesson.vulnerableCode} tone="red" />
                <LineWalkthrough code={lesson.vulnerableCode} lesson={lesson} />
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-300">
                This is a foundation lesson, so there is no vulnerable code sample yet. Use the mental model and methodology before moving into the lab-linked lessons.
              </div>
            )}
          </section>

          <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-emerald-100" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Lab Bridge</h2>
            </div>
            {relatedLab?.lab ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <LocalCommand label="Docker command" value="docker compose up --build -d" />
                <LocalCommand label="Target URL" value={relatedLab.lab.baseUrl} asLink />
                <LocalCommand label="Health check URL" value={relatedLab.lab.healthUrl} asLink />
                <LocalCommand label="Trace URL" value={relatedLab.lab.tracesUrl} asLink />
                <div className="flex flex-col gap-3 sm:flex-row xl:col-span-2">
                  <a
                    href={relatedLab.lab.baseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                  >
                    Open Lab
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <Link
                    href={`/labs/${relatedLab.id}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Go to Lab Page
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
                This foundation lesson prepares you for the practical labs. Finish the concept, then continue to the next linked lesson.
              </p>
            )}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <TeachingList title="Evidence Checklist" items={lesson.evidenceChecklist} icon={FileText} tone="cyan" />
            <TeachingList title="Common Mistakes" items={lesson.commonMistakes} icon={ShieldAlert} tone="red" />
          </section>

          <section id="fix" className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-200" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Fix and Mitigation</h2>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {lesson.secureCode ? (
                <CodeBlock title="Secure code example" body={lesson.secureCode} tone="green" />
              ) : (
                <article className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <h3 className="font-semibold text-emerald-100">Secure thinking example</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Identify the trust boundary, keep security decisions server-side, compare normal and changed behavior, then write a clear fix note.
                  </p>
                </article>
              )}
              <div className="space-y-4">
                <TeachingList title="Why the fix works" items={lesson.mitigation.slice(0, 3)} icon={CheckCircle2} tone="green" />
                <TeachingList
                  title="Defensive logging idea"
                  items={[
                    "Log abnormal request patterns without storing secrets.",
                    "Record denied authorization checks and secure endpoint comparisons.",
                    "Review traces after every local lab attempt.",
                  ]}
                  icon={TerminalSquare}
                  tone="slate"
                />
              </div>
            </div>
          </section>

          <section id="quiz" className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-cyan-100" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Mini Quiz</h2>
            </div>
            <div className="mt-5 grid gap-4">
              {lesson.quiz.map((question, index) => {
                const selected = answers[index];
                const isCorrect = selected === question.answer;

                return (
                  <article key={question.question} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
                    <p className="font-semibold text-white">{index + 1}. {question.question}</p>
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}
                          className={cn(
                            "min-h-10 rounded-md border px-3 py-2 text-left text-sm leading-5",
                            selected === option
                              ? isCorrect
                                ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                                : "border-red-300/40 bg-red-400/10 text-red-100"
                              : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-cyan-300/40",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {selected ? (
                      <p className="mt-3 rounded-md border border-white/10 bg-slate-950 p-3 text-sm leading-6 text-slate-300">
                        <span className={cn("font-semibold", isCorrect ? "text-emerald-200" : "text-red-100")}>
                          {isCorrect ? "Correct." : "Not quite."}
                        </span>{" "}
                        {question.explanation}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section id="report" className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Report Note Template</h2>
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-slate-950 p-4">
              <p className="text-sm leading-7 text-slate-200">{lesson.reportTemplate}</p>
              <CopyButton value={lesson.reportTemplate} label="Copy report note" />
            </div>
          </section>

          <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-100" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Post-Lab Debrief</h2>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <IntroCard title="What happened?" body={lesson.postLabDebrief.whatHappened} tone="green" />
              <IntroCard title="Why it worked" body={lesson.postLabDebrief.whyItWorked} tone="cyan" />
              <IntroCard title="Real-world impact" body={lesson.postLabDebrief.realWorldImpact} tone="red" />
              <IntroCard title="How to fix it" body={lesson.postLabDebrief.howToFix} tone="slate" />
              <IntroCard title="How to explain it" body={lesson.postLabDebrief.reportNote} tone="slate" wide />
            </div>
          </section>

          {nextLesson ? (
            <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
              <p className="text-sm font-semibold text-cyan-100">Next lesson recommendation</p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{nextLesson.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{nextLesson.summary}</p>
                </div>
                <Link
                  href={`/teaching/${nextLesson.slug}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-lg font-semibold text-white">Lesson Progress</h2>
            <nav className="mt-4 space-y-2" aria-label="Lesson sections">
              {lessonAnchors.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex min-h-10 items-center justify-between rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-200 hover:border-cyan-300/40"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                </a>
              ))}
            </nav>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-lg font-semibold text-white">What / Why / How / Fix</h2>
            <div className="mt-4 grid gap-2">
              {[
                ["What", lesson.beginnerIntro.what],
                ["Why", lesson.beginnerIntro.why],
                ["How", lesson.beginnerIntro.developerMistake],
                ["Fix", lesson.mitigation[0] ?? "Use a server-side security control."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-md border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-sm font-semibold text-cyan-100">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{body}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </WorkspaceFrame>
  );
}

function IntroCard({
  body,
  title,
  tone,
  wide = false,
}: {
  body: string;
  title: string;
  tone: "cyan" | "green" | "red" | "slate";
  wide?: boolean;
}) {
  const toneClass = {
    cyan: "border-cyan-300/20 bg-cyan-300/10",
    green: "border-emerald-300/20 bg-emerald-300/10",
    red: "border-red-300/20 bg-red-400/10",
    slate: "border-white/10 bg-slate-950/70",
  }[tone];

  return (
    <article className={cn("rounded-lg border p-4", toneClass, wide && "lg:col-span-2")}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </article>
  );
}

function TeachingList({
  icon: Icon,
  items,
  ordered = false,
  title,
  tone,
}: {
  icon: typeof ListChecks;
  items: string[];
  ordered?: boolean;
  title: string;
  tone: "amber" | "cyan" | "green" | "red" | "slate";
}) {
  const toneClass = {
    amber: "border-amber-300/20 bg-amber-300/10",
    cyan: "border-cyan-300/20 bg-cyan-300/10",
    green: "border-emerald-300/20 bg-emerald-300/10",
    red: "border-red-300/20 bg-red-400/10",
    slate: "border-white/10 bg-white/[0.04]",
  }[tone];
  const ListTag = ordered ? "ol" : "ul";

  return (
    <article className={cn("rounded-lg border p-5", toneClass)}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <ListTag className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="grid grid-cols-[30px_1fr] gap-3 text-sm leading-6 text-slate-300">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950/80 text-xs font-semibold text-cyan-100">
              {ordered ? index + 1 : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ListTag>
    </article>
  );
}

function CodeBlock({
  body,
  title,
  tone,
}: {
  body: string;
  title: string;
  tone: "green" | "red";
}) {
  return (
    <article className="min-w-0 rounded-lg border border-white/10 bg-slate-950/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-white">{title}</h3>
        <Badge tone={tone === "green" ? "green" : "red"}>{tone === "green" ? "Secure" : "Vulnerable"}</Badge>
      </div>
      <pre className="mt-4 max-h-[420px] overflow-auto rounded-md border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        <code>{body}</code>
      </pre>
      <CopyButton value={body} label="Copy code" />
    </article>
  );
}

function LineWalkthrough({
  code,
  lesson,
}: {
  code: string;
  lesson: TeachingLesson;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h3 className="font-semibold text-white">Line-by-line explanation</h3>
      <div className="mt-4 space-y-3">
        {code.split("\n").map((line, index) => (
          <div key={`${line}-${index}`} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
            <code className="block overflow-x-auto text-xs leading-5 text-cyan-100">
              {index + 1}: {line || "(blank line)"}
            </code>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              {explainCodeLine(line, index, lesson)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function explainCodeLine(line: string, index: number, lesson: TeachingLesson) {
  const cleanLine = line.trim();
  if (!cleanLine) return "This blank line separates steps so the vulnerable flow is easier to read.";
  if (index === 0) {
    return `Developer intent: start the feature logic for ${lesson.title}.`;
  }
  if (/username|password|token|accountId|headers|code|userId|comment|body|role/i.test(cleanLine)) {
    return `Attacker-controlled or trust-sensitive data appears here. Mistake to notice: ${lesson.beginnerIntro.developerMistake}`;
  }
  if (/db\.get|response\.json|return|verifyOtp|dangerouslySetInnerHTML|decode|accounts\[|tooManyAttempts/i.test(cleanLine)) {
    return `This line reaches a sensitive operation or response. It is dangerous when the earlier trust check is missing or incomplete.`;
  }
  return "Supporting logic for the vulnerable flow. Read it together with the mental model and ask which server-side check is missing.";
}

function LocalCommand({
  asLink = false,
  label,
  value,
}: {
  asLink?: boolean;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      {asLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-semibold text-emerald-200 hover:text-emerald-100">
          {value}
        </a>
      ) : (
        <code className="mt-2 block overflow-x-auto rounded-md bg-slate-950 px-3 py-3 text-sm text-emerald-200">
          {value}
        </code>
      )}
      <CopyButton value={value} label="Copy" />
    </article>
  );
}

function CopyButton({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10"
    >
      <Clipboard className="h-4 w-4" aria-hidden="true" />
      {copied ? "Copied" : label}
    </button>
  );
}
