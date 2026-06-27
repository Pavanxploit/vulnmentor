"use client";

import {
  Activity,
  BadgeCheck,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  Container,
  FileWarning,
  Flag,
  Gauge,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Lock,
  Logs,
  Play,
  RefreshCcw,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { activeChallenge, challenges, type Challenge } from "@/data/challenges";

type Tab = "brief" | "attack" | "root" | "defense";
type LabRuntimeStatus = "unavailable" | "checking" | "online" | "offline";

type LabRuntime = {
  status: LabRuntimeStatus;
  traces: string[];
  lastChecked: Date | null;
  error: string | null;
  refreshLab: () => void;
};

const tabs: { id: Tab; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "attack", label: "Attack" },
  { id: "root", label: "Root Cause" },
  { id: "defense", label: "Defense" },
];

export function VulnMentorApp() {
  const [selectedId, setSelectedId] = useState(activeChallenge.id);
  const [tab, setTab] = useState<Tab>("brief");
  const [hintCount, setHintCount] = useState(0);
  const [flagValue, setFlagValue] = useState("");
  const [flagState, setFlagState] = useState<"idle" | "correct" | "wrong">(
    "idle",
  );

  const selected = useMemo(
    () =>
      challenges.find((challenge) => challenge.id === selectedId) ??
      activeChallenge,
    [selectedId],
  );

  const isLocked = selected.status === "planned";
  const labRuntime = useLabRuntime(selected, isLocked);
  const completion = flagState === "correct" ? 68 : hintCount > 0 ? 42 : 28;

  function chooseChallenge(challenge: Challenge) {
    setSelectedId(challenge.id);
    setTab("brief");
    setHintCount(0);
    setFlagValue("");
    setFlagState("idle");
  }

  function revealHint() {
    if (isLocked) return;
    setHintCount((current) => Math.min(current + 1, selected.hints.length));
  }

  function resetLab() {
    setHintCount(0);
    setFlagValue("");
    setFlagState("idle");
    setTab("brief");
  }

  function submitFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLocked) return;
    setFlagState(flagValue.trim() === selected.flag ? "correct" : "wrong");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#151716]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
        <TopBar labRuntime={labRuntime} />
        <div className="grid flex-1 grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          <Sidebar selected={selected} onSelect={chooseChallenge} />
          <Workspace
            challenge={selected}
            tab={tab}
            setTab={setTab}
            hintCount={hintCount}
            revealHint={revealHint}
            flagValue={flagValue}
            setFlagValue={setFlagValue}
            flagState={flagState}
            submitFlag={submitFlag}
            resetLab={resetLab}
            isLocked={isLocked}
            labRuntime={labRuntime}
          />
          <MentorPanel
            challenge={selected}
            hintCount={hintCount}
            completion={completion}
            isLocked={isLocked}
          />
        </div>
      </div>
    </main>
  );
}

function useLabRuntime(challenge: Challenge, isLocked: boolean): LabRuntime {
  const [status, setStatus] = useState<LabRuntimeStatus>(
    challenge.lab && !isLocked ? "checking" : "unavailable",
  );
  const [traces, setTraces] = useState<string[]>(challenge.logs);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshLab = useCallback(async () => {
    if (!challenge.lab || isLocked) {
      setStatus("unavailable");
      setTraces(challenge.logs);
      setLastChecked(null);
      setError(null);
      return;
    }

    setStatus("checking");

    try {
      const healthResponse = await fetch(challenge.lab.healthUrl, {
        cache: "no-store",
      });

      if (!healthResponse.ok) {
        throw new Error(`Health check returned ${healthResponse.status}`);
      }

      const tracesResponse = await fetch(challenge.lab.tracesUrl, {
        cache: "no-store",
      });
      const traceText = tracesResponse.ok ? await tracesResponse.text() : "";
      const liveTraces = traceText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      setStatus("online");
      setTraces(liveTraces.length > 0 ? liveTraces : challenge.logs);
      setLastChecked(new Date());
      setError(null);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Lab health check could not complete";
      setStatus("offline");
      setTraces(challenge.logs);
      setLastChecked(new Date());
      setError(message);
    }
  }, [challenge, isLocked]);

  useEffect(() => {
    const initialCheck = window.setTimeout(refreshLab, 0);

    if (!challenge.lab || isLocked) {
      return () => window.clearTimeout(initialCheck);
    }

    const interval = window.setInterval(refreshLab, 12000);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, [challenge.lab, isLocked, refreshLab]);

  return { status, traces, lastChecked, error, refreshLab };
}

function TopBar({ labRuntime }: { labRuntime: LabRuntime }) {
  return (
    <header className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-md bg-[#151716] text-white shadow-sm">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold leading-tight">VulnMentor</h1>
          <p className="text-sm text-[#66706b]">
            AI-guided Web and API security learning sandbox
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusPill
          icon={<Container size={15} />}
          label={labStatusLabel(labRuntime.status)}
          tone={labRuntime.status}
        />
        <StatusPill icon={<Bot size={15} />} label="Mentor offline mode" />
        <StatusPill icon={<Activity size={15} />} label="MVP stage 1" />
      </div>
    </header>
  );
}

function labStatusLabel(status: LabRuntimeStatus) {
  if (status === "online") return "Docker lab online";
  if (status === "offline") return "Docker lab offline";
  if (status === "checking") return "Checking lab";
  return "Lab not connected";
}

function StatusPill({
  icon,
  label,
  tone = "unavailable",
}: {
  icon: React.ReactNode;
  label: string;
  tone?: LabRuntimeStatus;
}) {
  const tones = {
    online: "border-[#b7e2cd] bg-[#effaf4] text-[#0f6b53]",
    offline: "border-[#efcaca] bg-[#fff3f3] text-[#a03434]",
    checking: "border-[#ead2a0] bg-[#fff8e8] text-[#755614]",
    unavailable: "border-[#dadbd2] bg-white text-[#3e4742]",
  };

  return (
    <span className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 ${tones[tone]}`}>
      {icon}
      {label}
    </span>
  );
}

function Sidebar({
  selected,
  onSelect,
}: {
  selected: Challenge;
  onSelect: (challenge: Challenge) => void;
}) {
  return (
    <aside className="rounded-md border border-[#dedfd7] bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LayoutDashboard size={17} />
          Labs
        </div>
        <span className="rounded-md bg-[#e7f6f0] px-2 py-1 text-xs font-medium text-[#0f6b53]">
          1 live
        </span>
      </div>

      <div className="space-y-2">
        {challenges.map((challenge) => {
          const active = challenge.id === selected.id;
          const locked = challenge.status === "planned";

          return (
            <button
              key={challenge.id}
              type="button"
              onClick={() => onSelect(challenge)}
              className={`w-full rounded-md border p-3 text-left transition ${
                active
                  ? "border-[#151716] bg-[#f0f1eb]"
                  : "border-[#e4e5dd] bg-white hover:border-[#aeb4ad]"
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-snug">
                    {challenge.title}
                  </p>
                  <p className="mt-1 text-xs text-[#66706b]">
                    {challenge.category}
                  </p>
                </div>
                {locked ? (
                  <Lock className="shrink-0 text-[#8b918d]" size={16} />
                ) : (
                  <Play className="shrink-0 text-[#0f766e]" size={16} />
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge text={challenge.difficulty} tone="neutral" />
                <Badge text={challenge.time} tone="warm" />
                <Badge text={`${challenge.points} pts`} tone="teal" />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function Workspace({
  challenge,
  tab,
  setTab,
  hintCount,
  revealHint,
  flagValue,
  setFlagValue,
  flagState,
  submitFlag,
  resetLab,
  isLocked,
  labRuntime,
}: {
  challenge: Challenge;
  tab: Tab;
  setTab: (tab: Tab) => void;
  hintCount: number;
  revealHint: () => void;
  flagValue: string;
  setFlagValue: (value: string) => void;
  flagState: "idle" | "correct" | "wrong";
  submitFlag: (event: FormEvent<HTMLFormElement>) => void;
  resetLab: () => void;
  isLocked: boolean;
  labRuntime: LabRuntime;
}) {
  return (
    <section className="min-w-0 rounded-md border border-[#dedfd7] bg-white shadow-sm">
      <div className="border-b border-[#e2e3db] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge text={challenge.category} tone="teal" />
              <Badge text={challenge.difficulty} tone="neutral" />
              {isLocked ? (
                <Badge text="Planned" tone="danger" />
              ) : (
                <Badge text="Live Lab" tone="success" />
              )}
            </div>
            <h2 className="text-2xl font-semibold leading-tight">
              {challenge.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5c6661]">
              {challenge.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton
              icon={<Bot size={17} />}
              label="Hint"
              onClick={revealHint}
              disabled={isLocked || hintCount >= challenge.hints.length}
            />
            <IconButton
              icon={<RefreshCcw size={17} />}
              label="Reset"
              onClick={resetLab}
            />
          </div>
        </div>
        <LabRuntimeBanner challenge={challenge} labRuntime={labRuntime} />
      </div>

      <div className="border-b border-[#e2e3db] px-4 py-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`h-10 rounded-md border px-3 text-sm font-medium transition ${
                tab === item.id
                  ? "border-[#151716] bg-[#151716] text-white"
                  : "border-[#dfe1d8] bg-[#fafaf8] text-[#424a45] hover:border-[#aeb4ad]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {isLocked ? (
          <LockedState challenge={challenge} />
        ) : (
          <>
            {tab === "brief" && <BriefTab challenge={challenge} />}
            {tab === "attack" && (
              <AttackTab
                challenge={challenge}
                labRuntime={labRuntime}
                flagValue={flagValue}
                setFlagValue={setFlagValue}
                flagState={flagState}
                submitFlag={submitFlag}
              />
            )}
            {tab === "root" && <RootCauseTab challenge={challenge} />}
            {tab === "defense" && <DefenseTab challenge={challenge} />}
          </>
        )}
      </div>
    </section>
  );
}

function LabRuntimeBanner({
  challenge,
  labRuntime,
}: {
  challenge: Challenge;
  labRuntime: LabRuntime;
}) {
  if (!challenge.lab) {
    return null;
  }

  const statusText = {
    online: "Lab is online",
    offline: "Lab is offline",
    checking: "Checking lab",
    unavailable: "Lab not connected",
  }[labRuntime.status];

  const helpText =
    labRuntime.status === "online"
      ? `Connected to ${challenge.lab.baseUrl}. Runtime traces can be viewed in the Attack tab.`
      : "Start Docker with `docker compose up --build`, then refresh the lab status.";

  return (
    <div className="mt-4 rounded-md border border-[#dfe1d8] bg-[#fbfbf8] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              text={statusText}
              tone={labRuntime.status === "online" ? "success" : labRuntime.status === "offline" ? "danger" : "warm"}
            />
            {labRuntime.lastChecked && (
              <span className="text-xs text-[#69736d]">
                Last checked {labRuntime.lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-5 text-[#5c6661]">{helpText}</p>
          {labRuntime.error && (
            <p className="mt-1 text-xs text-[#a03434]">
              Health detail: {labRuntime.error}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={labRuntime.refreshLab}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfd2c8] bg-white px-3 text-sm font-semibold text-[#2f3732] transition hover:border-[#8f9992]"
        >
          <RefreshCcw size={16} />
          Refresh Lab
        </button>
      </div>
    </div>
  );
}

function BriefTab({ challenge }: { challenge: Challenge }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <div className="rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <ListChecks size={18} />
          Learning Path
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {challenge.workflow.map((step, index) => (
            <div
              key={step}
              className="rounded-md border border-[#dfe1d8] bg-white p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="grid size-7 place-items-center rounded-md bg-[#151716] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                {index < challenge.workflow.length - 1 ? (
                  <ChevronRight className="hidden text-[#909891] sm:block" />
                ) : (
                  <CheckCircle2 className="text-[#0f766e]" />
                )}
              </div>
              <p className="text-sm font-medium">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <Gauge size={18} />
          Skill Map
        </div>
        <div className="space-y-2">
          {challenge.skills.map((skill) => (
            <div
              key={skill}
              className="flex items-center gap-2 rounded-md border border-[#dfe1d8] bg-white px-3 py-2 text-sm"
            >
              <BadgeCheck size={16} className="text-[#0f766e]" />
              {skill}
            </div>
          ))}
        </div>
      </div>

      <div className="xl:col-span-2">
        <LabTopology />
      </div>
    </div>
  );
}

function AttackTab({
  challenge,
  labRuntime,
  flagValue,
  setFlagValue,
  flagState,
  submitFlag,
}: {
  challenge: Challenge;
  labRuntime: LabRuntime;
  flagValue: string;
  setFlagValue: (value: string) => void;
  flagState: "idle" | "correct" | "wrong";
  submitFlag: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const traceLines =
    labRuntime.traces.length > 0 ? labRuntime.traces : challenge.logs;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="rounded-md border border-[#202421] bg-[#111412] p-4 text-white">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <Terminal size={18} />
            Lab Console
          </div>
          <span className="rounded-md bg-[#22352f] px-2 py-1 text-xs text-[#9ee6cf]">
            sandbox:web-01
          </span>
        </div>
        <div className="space-y-3 font-mono text-sm leading-6 text-[#d7ded8]">
          <p>$ curl -i http://lab.local/login</p>
          <p className="text-[#a8b2ab]">
            HTTP/1.1 200 OK | form fields: username, password
          </p>
          <p>$ submit payload through login form</p>
          <p className="text-[#e8bf73]">Monitor result in attack traces...</p>
        </div>
      </div>

      <form
        onSubmit={submitFlag}
        className="rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-4"
      >
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <Flag size={18} />
          Flag Check
        </div>
        <input
          value={flagValue}
          onChange={(event) => setFlagValue(event.target.value)}
          placeholder="VM{...}"
          className="h-11 w-full rounded-md border border-[#cdd1c9] bg-white px-3 font-mono text-sm outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#99d7c8]"
        />
        <button
          type="submit"
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#151716] px-3 text-sm font-semibold text-white transition hover:bg-[#29302b]"
        >
          <KeyRound size={17} />
          Submit Flag
        </button>
        {flagState === "correct" && (
          <p className="mt-3 rounded-md border border-[#b7e2cd] bg-[#eefaf4] px-3 py-2 text-sm font-medium text-[#0f6b53]">
            Correct. The lab is marked as exploited.
          </p>
        )}
        {flagState === "wrong" && (
          <p className="mt-3 rounded-md border border-[#f1b8b8] bg-[#fff2f2] px-3 py-2 text-sm font-medium text-[#ad2f2f]">
            Flag mismatch. Review the query behavior and try again.
          </p>
        )}
      </form>

      <div className="rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-4 xl:col-span-2">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Logs size={18} />
            Attack Traces
          </div>
          <button
            type="button"
            onClick={labRuntime.refreshLab}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#cfd2c8] bg-white px-3 text-sm font-semibold text-[#2f3732] transition hover:border-[#8f9992]"
          >
            <RefreshCcw size={15} />
            Refresh Traces
          </button>
        </div>
        <p className="mb-3 text-sm leading-5 text-[#5c6661]">
          {labRuntime.status === "online"
            ? "Showing traces from the running Docker lab."
            : "Showing sample traces until the Docker lab is online."}
        </p>
        <div className="space-y-2">
          {traceLines.map((log) => (
            <div
              key={log}
              className="rounded-md border border-[#dfe1d8] bg-white px-3 py-2 font-mono text-xs text-[#3d4640]"
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RootCauseTab({ challenge }: { challenge: Challenge }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-md border border-[#f0caca] bg-[#fff7f7] p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold text-[#8e2424]">
          <FileWarning size={18} />
          Vulnerable Code
        </div>
        <CodeBlock code={challenge.code.vulnerable} />
      </div>
      <div className="rounded-md border border-[#bfe2d3] bg-[#f4fbf7] p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold text-[#0f6b53]">
          <ShieldCheck size={18} />
          Secure Code
        </div>
        <CodeBlock code={challenge.code.secure} />
      </div>
      <div className="rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-4 xl:col-span-2">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <BookOpen size={18} />
          Root Cause
        </div>
        <p className="text-sm leading-6 text-[#4d5852]">{challenge.rootCause}</p>
      </div>
    </div>
  );
}

function DefenseTab({ challenge }: { challenge: Challenge }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <ShieldCheck size={18} />
          Mitigation Checklist
        </div>
        <div className="space-y-2">
          {challenge.mitigation.map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 rounded-md border border-[#dfe1d8] bg-white px-3 py-2 text-sm leading-5"
            >
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#0f766e]" size={16} />
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-[#f1d19a] bg-[#fffaf0] p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold text-[#825b12]">
          <FileWarning size={18} />
          Security Impact
        </div>
        <p className="text-sm leading-6 text-[#5b4b2f]">{challenge.impact}</p>
      </div>
    </div>
  );
}

function MentorPanel({
  challenge,
  hintCount,
  completion,
  isLocked,
}: {
  challenge: Challenge;
  hintCount: number;
  completion: number;
  isLocked: boolean;
}) {
  return (
    <aside className="rounded-md border border-[#dedfd7] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <Bot size={19} />
          AI Mentor
        </div>
        <span className="rounded-md bg-[#f3eee4] px-2 py-1 text-xs font-medium text-[#795c25]">
          guided
        </span>
      </div>

      <div className="mb-4 rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Learning progress</span>
          <span className="font-mono text-[#0f6b53]">{completion}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#e4e5dc]">
          <div
            className="h-2 rounded-full bg-[#0f766e]"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {isLocked ? (
        <div className="rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-3 text-sm text-[#5b655f]">
          Planned labs will be connected after the first sandbox is complete.
        </div>
      ) : (
        <div className="space-y-3">
          {challenge.hints.map((hint, index) => {
            const visible = index < hintCount;
            return (
              <div
                key={hint.title}
                className={`rounded-md border p-3 ${
                  visible
                    ? "border-[#b7e2cd] bg-[#f0fbf5]"
                    : "border-[#e1e2da] bg-[#fbfbf8]"
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  {visible ? (
                    <CheckCircle2 size={16} className="text-[#0f766e]" />
                  ) : (
                    <Circle size={16} className="text-[#9aa29d]" />
                  )}
                  {hint.title}
                </div>
                <p className="text-sm leading-5 text-[#4d5852]">
                  {visible
                    ? hint.body
                    : "Locked until the previous guidance step is used."}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

function LabTopology() {
  return (
    <div className="rounded-md border border-[#e1e2da] bg-[#fbfbf8] p-4">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        <Container size={18} />
        Sandbox Topology
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        <TopologyNode icon={<Terminal size={20} />} title="Student" body="Browser" />
        <ChevronRight className="hidden text-[#929992] md:block" />
        <TopologyNode icon={<Code2 size={20} />} title="Lab Web" body="Vulnerable app" />
        <ChevronRight className="hidden text-[#929992] md:block" />
        <TopologyNode icon={<Logs size={20} />} title="Trace Store" body="Logs + flags" />
      </div>
    </div>
  );
}

function TopologyNode({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-[#dfe1d8] bg-white p-4">
      <div className="mb-3 grid size-10 place-items-center rounded-md bg-[#151716] text-white">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[#66706b]">{body}</p>
    </div>
  );
}

function LockedState({ challenge }: { challenge: Challenge }) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-md border border-dashed border-[#cfd2c8] bg-[#fbfbf8] p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-md bg-[#151716] text-white">
          <Lock size={23} />
        </div>
        <h3 className="text-xl font-semibold">{challenge.title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5c6661]">
          This lab is in the next build stage. The first live sandbox is SQL
          Injection so the core workflow can be tested end to end.
        </p>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-[#111412] p-4 font-mono text-sm leading-6 text-[#d7ded8]">
      <code>{code}</code>
    </pre>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#cfd2c8] bg-white px-3 text-sm font-semibold text-[#2f3732] transition hover:border-[#8f9992] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Badge({
  text,
  tone,
}: {
  text: string;
  tone: "neutral" | "teal" | "warm" | "success" | "danger";
}) {
  const tones = {
    neutral: "border-[#d8dad0] bg-[#f5f5f0] text-[#4b544f]",
    teal: "border-[#b9ded4] bg-[#edf9f5] text-[#0f6b53]",
    warm: "border-[#ead2a0] bg-[#fff8e8] text-[#755614]",
    success: "border-[#b7e2cd] bg-[#effaf4] text-[#0f6b53]",
    danger: "border-[#efcaca] bg-[#fff3f3] text-[#a03434]",
  };

  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${tones[tone]}`}
    >
      {text}
    </span>
  );
}
