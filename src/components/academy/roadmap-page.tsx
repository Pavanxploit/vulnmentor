"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Route, ShieldCheck } from "lucide-react";
import { challenges } from "@/data/challenges";
import { getTeachingLesson, teachingTracks } from "@/data/teaching";
import { Badge, MetricCard, WorkspaceFrame } from "./academy-ui";
import { useLearningProgress } from "./progress";

const roadmapTracks = [
  {
    title: "Start from 0",
    body: "Build the foundation before touching vulnerable targets.",
    items: [
      "What is a website?",
      "What is HTTP?",
      "Request and response",
      "Headers and cookies",
      "Parameters and input",
      "Authentication vs authorization",
      "What is an API?",
      "What is JSON?",
      "Client-side vs server-side security",
    ],
  },
  {
    title: "Web Security",
    body: "Understand browser-backed vulnerabilities and secure coding fixes.",
    items: ["SQL Injection", "Stored XSS", "Authentication flaws", "Access control basics"],
  },
  {
    title: "API Security",
    body: "Practice modern API trust boundaries and response design.",
    items: [
      "API basics",
      "BOLA / IDOR",
      "JWT trust issues",
      "Rate limiting",
      "Excessive data exposure",
      "Secure response design",
    ],
  },
  {
    title: "Defender Thinking",
    body: "Turn lab solves into evidence, fixes, and reports.",
    items: [
      "Read logs",
      "Understand traces",
      "Identify root cause",
      "Write mitigation",
      "Write report",
      "Compare vulnerable vs secure code",
    ],
  },
];

export function RoadmapPage() {
  const { progress, student } = useLearningProgress(challenges);
  const completedSet = new Set(progress.completed);
  const completedLessons = progress.quizResults.length;
  const totalLessons = teachingTracks.reduce((sum, track) => sum + track.slugs.length, 0);

  return (
    <WorkspaceFrame
      activeHref="/roadmap"
      badge="0 to hero"
      title="Cybersecurity Learning Roadmap"
      body="A visual path from basic web concepts to safe local labs, evidence collection, root cause analysis, secure fixes, and reporting."
      showGuide={student?.role === "instructor"}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Lesson checks" value={`${completedLessons}/${totalLessons}`} helper="Saved quiz results" icon={BookOpen} />
        <MetricCard label="Solved labs" value={`${progress.completed.length}/${challenges.length}`} helper="Flags accepted" icon={CheckCircle2} />
        <MetricCard label="Evidence notes" value={`${progress.evidenceNotebooks.length}`} helper="Lab notebooks saved" icon={ShieldCheck} />
      </section>

      <section className="grid gap-5">
        {roadmapTracks.map((track, trackIndex) => {
          const linkedTrack = teachingTracks.find((item) => item.title === track.title);

          return (
            <article key={track.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="grid gap-4 lg:grid-cols-[56px_1fr_auto] lg:items-start">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-cyan-300/10 text-lg font-semibold text-cyan-100">
                  {trackIndex + 1}
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{track.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{track.body}</p>
                </div>
                <Badge tone="cyan">{track.items.length} milestones</Badge>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {track.items.map((item, index) => {
                  const lessonSlug = linkedTrack?.slugs[index];
                  const lesson = lessonSlug ? getTeachingLesson(lessonSlug) : undefined;
                  const solved =
                    lesson?.relatedLab && completedSet.has(lesson.relatedLab.id);

                  return (
                    <Link
                      key={`${track.title}-${item}`}
                      href={lesson ? `/teaching/${lesson.slug}` : "/teaching"}
                      className="group rounded-lg border border-white/10 bg-slate-950/70 p-4 hover:border-cyan-300/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-300/10 text-xs font-semibold text-cyan-100">
                          {index + 1}
                        </span>
                        <Badge tone={solved ? "green" : lesson ? "slate" : "amber"}>
                          {solved ? "Lab solved" : lesson ? "Lesson" : "Milestone"}
                        </Badge>
                      </div>
                      <h3 className="mt-4 font-semibold text-white">{item}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {lesson?.summary ?? "Covered through linked labs, notes, and defender workflow."}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-cyan-200">
                        Open step
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-emerald-100" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-white">How to use this roadmap</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Study the lesson, answer the quiz, open only the local Docker lab, save evidence, submit the flag, compare the secure fix, then generate a report. That is the professional workflow VulnMentor is training.
        </p>
      </section>
    </WorkspaceFrame>
  );
}
