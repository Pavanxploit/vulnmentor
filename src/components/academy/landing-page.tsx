import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, BrainCircuit, CheckCircle2, Flag, KeyRound, Network, ShieldCheck, TerminalSquare, Trophy } from "lucide-react";
import { AcademyTopNav, Badge, PrimaryLink, SecondaryLink, SectionHeading } from "./academy-ui";

const featureCards = [
  {
    title: "Web Security",
    body: "Practice injection, stored XSS, authentication flaws, and secure rendering patterns.",
    icon: ShieldCheck,
    status: "Live",
  },
  {
    title: "API Security",
    body: "Explore BOLA, JWT tampering, rate-limit bypass, and excessive data exposure.",
    icon: KeyRound,
    status: "Live",
  },
  {
    title: "Linux Basics",
    body: "Planned foundations for terminal usage, permissions, services, and log inspection.",
    icon: TerminalSquare,
    status: "Planned",
  },
  {
    title: "Privilege Escalation",
    body: "Future guided labs for privilege boundaries, misconfigurations, and defensive checks.",
    icon: Trophy,
    status: "Planned",
  },
  {
    title: "Networking",
    body: "Build intuition for HTTP, ports, headers, traffic flow, and lab isolation.",
    icon: Network,
    status: "Planned",
  },
];

const reasons = [
  "Beginner-friendly lessons with clear objectives",
  "Safe vulnerable labs that stay on localhost",
  "Docker-based environments for repeatable practice",
  "Guided hints without revealing flags too early",
  "Progress tracking for presentation and review",
  "Defense notes so students learn fixes, not only attacks",
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AcademyTopNav />

      <section className="relative flex min-h-[720px] items-center overflow-hidden border-b border-white/10">
        <Image
          src="/vulnmentor-dashboard-preview.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-right-top opacity-45"
        />
        <div className="absolute inset-0 bg-slate-950/62" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="max-w-4xl">
            <Badge tone="green">Local-first cyber academy</Badge>
            <h1 className="mt-6 max-w-[10ch] text-4xl font-semibold leading-tight text-white sm:max-w-4xl sm:text-5xl md:text-7xl">
              Learn Cybersecurity with Safe Vulnerable Labs
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              VulnMentor helps students learn Web and API security through guided lessons, Docker labs,
              hints, flags, traces, and practical defense explanations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="/dashboard">Start Learning</PrimaryLink>
              <SecondaryLink href="/dashboard#labs">View Labs</SecondaryLink>
            </div>
          </div>

          <div className="grid content-end gap-3 lg:justify-self-end">
            <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4 shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <p className="text-sm font-semibold text-white">Current training build</p>
                  <p className="text-xs text-slate-400">Web + API CTF sandbox</p>
                </div>
                <Badge tone="cyan">6 labs</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
                <div className="rounded-md bg-white/5 p-3">
                  <p className="text-xl font-semibold text-white sm:text-2xl">880</p>
                  <p className="text-xs text-slate-400">points</p>
                </div>
                <div className="rounded-md bg-white/5 p-3">
                  <p className="text-xl font-semibold text-white sm:text-2xl">2</p>
                  <p className="text-xs text-slate-400">tracks</p>
                </div>
                <div className="rounded-md bg-white/5 p-3">
                  <p className="text-xl font-semibold text-white sm:text-2xl">100%</p>
                  <p className="text-xs text-slate-400">local</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="paths" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Learning modules"
          title="Choose a path, open a lab, capture the flag"
          body="The structure is designed for students who need both simple theory and hands-on practice."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <article key={feature.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-100">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <Badge tone={feature.status === "Live" ? "green" : "slate"}>{feature.status}</Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <SectionHeading
            eyebrow="Why VulnMentor?"
            title="Built for safe student learning, not public attacking"
            body="The platform keeps vulnerable services isolated while giving students enough guidance to understand the vulnerability, exploit path, detection signal, and secure fix."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason} className="flex gap-3 rounded-lg border border-white/10 bg-slate-950/70 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-200">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <Boxes className="h-6 w-6 text-cyan-200" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-semibold text-white">Docker sandbox</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Students run labs locally and reset the full environment when they want a clean state.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <BrainCircuit className="h-6 w-6 text-emerald-200" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-semibold text-white">Guided hints</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Hint levels support learning without turning the project into an answer sheet.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <Flag className="h-6 w-6 text-amber-200" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-semibold text-white">Flag workflow</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">The portal validates captured flags and stores local progress for demos and reports.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Ready to continue your lab path?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Open the dashboard, pick a lab, start Docker, and track your progress.</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
