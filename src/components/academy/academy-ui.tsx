import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Activity, BookOpen, ClipboardCheck, FlaskConical, GraduationCap, LayoutDashboard, Map, NotebookPen, Route, Settings, Trophy } from "lucide-react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Roadmap", href: "/roadmap", icon: Map },
  { label: "Teaching", href: "/teaching", icon: GraduationCap },
  { label: "Learning Paths", href: "/learning-paths", icon: Route },
  { label: "Labs", href: "/labs", icon: FlaskConical },
  { label: "Progress", href: "/progress", icon: Trophy },
  { label: "Guide Console", href: "/guide", icon: ClipboardCheck, guideOnly: true },
  { label: "Notes", href: "/notes", icon: NotebookPen },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

type BadgeTone = "cyan" | "green" | "amber" | "red" | "slate";

const badgeTones: Record<BadgeTone, string> = {
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  red: "border-red-400/30 bg-red-400/10 text-red-100",
  slate: "border-slate-500/30 bg-slate-800 text-slate-200",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium", badgeTones[tone])}>
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm font-semibold text-cyan-200">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{title}</h2>
      {body ? <p className="mt-3 text-base leading-7 text-slate-300">{body}</p> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

/**
 * Shared loading, empty, and error primitives.
 *
 * They exist so every page expresses these three states the same way. Pages
 * previously rendered zeroed data while a fetch was still in flight, which read
 * as "you have no progress" until the real numbers arrived.
 */

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse rounded bg-white/10", className)}
    />
  );
}

/** Matches MetricCard's exact shape so the layout does not shift when data lands. */
export function MetricCardSkeleton({ icon: Icon }: { icon?: LucideIcon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-20" />
        {Icon ? <Icon className="h-4 w-4 text-cyan-200/40" aria-hidden="true" /> : null}
      </div>
      <Skeleton className="mt-3 h-8 w-24" />
      <Skeleton className="mt-2 h-4 w-28" />
    </div>
  );
}

export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-md border border-white/10 bg-slate-950/70 p-3">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="mt-2 h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-cyan-200",
        className,
      )}
    />
  );
}

/**
 * An empty state should tell the student what to do next, not just report
 * absence, so the action link is part of the component rather than optional
 * decoration callers remember to add.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  /** Use for navigation. Pass `onAction` instead for in-page actions like clearing filters. */
  actionHref?: string;
  onAction?: () => void;
}) {
  const actionClass =
    "mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-400 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-300";

  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-white/15 bg-slate-950/40 px-5 py-8 text-center">
      {Icon ? (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/10">
          <Icon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
        </span>
      ) : null}
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{body}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={actionClass}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && !actionHref && onAction ? (
        <button type="button" onClick={onAction} className={actionClass}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-rose-300/25 bg-rose-300/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-rose-100">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border border-rose-200/30 bg-rose-200/10 px-3 text-xs font-semibold text-rose-50 hover:bg-rose-200/20"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-200"
    >
      {children}
    </Link>
  );
}

export function AcademyTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="VulnMentor home">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-400 text-slate-950">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold text-white">VulnMentor</span>
            <span className="hidden text-xs text-slate-400 sm:block">Safe Web and API security labs</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <Link className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/dashboard">
            Dashboard
          </Link>
          <Link className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/teaching">
            Teaching
          </Link>
          <Link className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/roadmap">
            Roadmap
          </Link>
          <Link className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/learning-paths">
            Learning Paths
          </Link>
          <Link className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/labs">
            Labs
          </Link>
        </nav>
        <Link
          href="/register"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/15 sm:px-4"
        >
          <span className="sm:hidden">Start</span>
          <span className="hidden sm:inline">Start Learning</span>
        </Link>
      </div>
    </header>
  );
}

export function WorkspaceFrame({
  action,
  activeHref,
  badge,
  badgeTone = "cyan",
  body,
  children,
  showGuide = false,
  title,
}: {
  action?: React.ReactNode;
  activeHref: string;
  badge: string;
  badgeTone?: BadgeTone;
  body: string;
  children: React.ReactNode;
  showGuide?: boolean;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-[1500px] min-w-0 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <DashboardSidebar activeHref={activeHref} showGuide={showGuide} />
        <section className="min-w-0 space-y-5">
          <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <Badge tone={badgeTone}>{badge}</Badge>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{title}</h1>
              <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-300">{body}</p>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export function DashboardSidebar({
  activeHref,
  showGuide = false,
}: {
  activeHref?: string;
  showGuide?: boolean;
}) {
  return (
    <aside className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950/80 p-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
      <div className="mb-5 px-2">
        <p className="text-xs font-semibold uppercase text-cyan-200">Workspace</p>
        <p className="mt-1 text-sm text-slate-400">Plan, practice, submit, improve.</p>
      </div>
      <nav className="space-y-1" aria-label="Dashboard navigation">
        {sidebarItems.filter((item) => !("guideOnly" in item) || showGuide).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-white/5 hover:text-white",
              activeHref === item.href ? "bg-cyan-300/10 text-white" : "text-slate-300",
            )}
          >
            <item.icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
          <Activity className="h-4 w-4" aria-hidden="true" />
          Local-first mode
        </div>
        <p className="mt-2 break-words text-xs leading-5 text-slate-300">
          Keep vulnerable targets on localhost or private lab networks only.
        </p>
      </div>
    </aside>
  );
}
