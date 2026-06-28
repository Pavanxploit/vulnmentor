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

      <section className="relative flex min-h-[560px] items-center overflow-hidden border-b border-white/10 bg-slate-950">
        <HeroLabScene />
        <div className="relative mx-auto flex w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge tone="green">Local-first cyber academy</Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
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

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4">
                <p className="text-2xl font-semibold text-white">6</p>
                <p className="mt-1 text-xs uppercase text-slate-400">labs</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4">
                <p className="text-2xl font-semibold text-white">2</p>
                <p className="mt-1 text-xs uppercase text-slate-400">tracks</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-900/80 p-4">
                <p className="text-2xl font-semibold text-white">100%</p>
                <p className="mt-1 text-xs uppercase text-slate-400">local</p>
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

function HeroLabScene() {
  const nodes = [
    { icon: TerminalSquare, className: "right-[30%] top-[18%]", tone: "text-cyan-100" },
    { icon: ShieldCheck, className: "right-[12%] top-[33%]", tone: "text-emerald-100" },
    { icon: KeyRound, className: "right-[42%] top-[47%]", tone: "text-amber-100" },
    { icon: Flag, className: "right-[19%] top-[64%]", tone: "text-red-100" },
    { icon: Network, className: "right-[50%] top-[72%]", tone: "text-cyan-100" },
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.18)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute inset-y-0 right-0 hidden w-[62%] md:block">
        <div className="absolute left-[18%] top-[22%] h-px w-[48%] rotate-12 bg-cyan-300/30" />
        <div className="absolute left-[28%] top-[52%] h-px w-[42%] -rotate-12 bg-emerald-300/25" />
        <div className="absolute left-[38%] top-[34%] h-[42%] w-px rotate-[18deg] bg-white/15" />
        <div className="absolute right-[8%] top-[12%] h-[76%] w-[78%] rounded-lg border border-cyan-300/15 bg-slate-900/30" />
        <div className="absolute right-[18%] top-[25%] h-[46%] w-[46%] rounded-lg border border-emerald-300/15 bg-slate-950/45" />
        {nodes.map((node, index) => (
          <div
            key={index}
            className={`absolute flex h-16 w-16 items-center justify-center rounded-lg border border-white/15 bg-slate-950/85 shadow-2xl ${node.className}`}
          >
            <node.icon className={`h-7 w-7 ${node.tone}`} />
          </div>
        ))}
        <div className="absolute right-[8%] top-[78%] grid w-[260px] grid-cols-6 gap-2 opacity-70">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} className="h-2 rounded-sm bg-cyan-200/25" />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-slate-950/40" />
      <div className="absolute inset-y-0 left-0 w-full bg-slate-950/70 md:w-[62%]" />
    </div>
  );
}
