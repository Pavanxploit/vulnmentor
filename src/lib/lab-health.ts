import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { challenges } from "@/data/challenges";

/**
 * Docker lab health manager.
 *
 * Health is probed from the server rather than the browser so that one check
 * serves every open tab. A classroom of thirty students polling six labs each
 * would otherwise put 180 requests per interval onto the lab containers.
 *
 * The HTTP probe is the primary signal because it answers the question students
 * actually care about: does the lab respond. `docker compose ps` is consulted
 * only to tell a container that is still booting apart from one that is not
 * running at all, and everything degrades gracefully when Docker is unavailable.
 */

const execFileAsync = promisify(execFile);

export type LabRuntimeStatus = "up" | "down" | "starting" | "unknown";

export type LabHealthRecord = {
  challengeId: string;
  title: string;
  serviceName: string;
  baseUrl: string | null;
  status: LabRuntimeStatus;
  detail: string;
  responseTimeMs: number | null;
};

export type LabHealthSnapshot = {
  checkedAt: string;
  dockerAvailable: boolean;
  dockerDetail: string;
  labs: LabHealthRecord[];
  summary: { up: number; down: number; starting: number; unknown: number };
};

const cacheTtlMs = 10_000;
const probeTimeoutMs = 2_000;
const dockerTimeoutMs = 8_000;
const restartTimeoutMs = 90_000;

let cached: { snapshot: LabHealthSnapshot; expiresAt: number } | null = null;
let inFlight: Promise<LabHealthSnapshot> | null = null;

/** Docker service names are never taken from request input, only from here. */
export function getKnownServiceNames() {
  return challenges
    .map((challenge) => challenge.lab?.serviceName)
    .filter((name): name is string => Boolean(name));
}

export async function getLabHealth(options?: { force?: boolean }): Promise<LabHealthSnapshot> {
  if (!options?.force && cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  // Collapse simultaneous requests onto one check. Thirty dashboards loading at
  // the start of a class should still produce a single probe round.
  if (inFlight) return inFlight;

  inFlight = collectSnapshot()
    .then((snapshot) => {
      cached = { snapshot, expiresAt: Date.now() + cacheTtlMs };
      return snapshot;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function invalidateLabHealthCache() {
  cached = null;
}

async function collectSnapshot(): Promise<LabHealthSnapshot> {
  const docker = await readDockerState();

  const labs = await Promise.all(
    challenges.map(async (challenge): Promise<LabHealthRecord> => {
      const lab = challenge.lab;

      if (!lab) {
        return {
          challengeId: challenge.id,
          title: challenge.title,
          serviceName: "",
          baseUrl: null,
          status: "unknown",
          detail: "No Docker lab is defined for this challenge yet.",
          responseTimeMs: null,
        };
      }

      const probe = await probeHealthEndpoint(lab.healthUrl);
      const containerState = docker.states.get(lab.serviceName);

      return {
        challengeId: challenge.id,
        title: challenge.title,
        serviceName: lab.serviceName,
        baseUrl: lab.baseUrl,
        responseTimeMs: probe.responseTimeMs,
        ...resolveStatus(probe, containerState, docker.available),
      };
    }),
  );

  return {
    checkedAt: new Date().toISOString(),
    dockerAvailable: docker.available,
    dockerDetail: docker.detail,
    labs,
    summary: {
      up: labs.filter((lab) => lab.status === "up").length,
      down: labs.filter((lab) => lab.status === "down").length,
      starting: labs.filter((lab) => lab.status === "starting").length,
      unknown: labs.filter((lab) => lab.status === "unknown").length,
    },
  };
}

function resolveStatus(
  probe: { ok: boolean; detail: string },
  containerState: string | undefined,
  dockerAvailable: boolean,
): { status: LabRuntimeStatus; detail: string } {
  if (probe.ok) {
    return { status: "up", detail: "Health endpoint responded." };
  }

  if (!dockerAvailable) {
    return {
      status: "down",
      detail: `${probe.detail} Docker state unavailable, so this may just need starting.`,
    };
  }

  if (!containerState) {
    return { status: "down", detail: "Container is not created. Run docker compose up." };
  }

  // A container that Docker considers live but that is not yet answering is
  // mid-boot, not broken. Showing that distinction stops students from
  // restarting a lab that was about to come up on its own.
  if (containerState === "running" || containerState === "restarting") {
    return { status: "starting", detail: `Container is ${containerState} but not answering yet.` };
  }

  return { status: "down", detail: `Container state is ${containerState}.` };
}

async function probeHealthEndpoint(healthUrl: string) {
  const startedAt = Date.now();

  try {
    const response = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(probeTimeoutMs),
    });

    return {
      ok: response.ok,
      responseTimeMs: Date.now() - startedAt,
      detail: response.ok ? "Health endpoint responded." : `Health endpoint returned ${response.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      responseTimeMs: null,
      detail:
        (error as Error).name === "TimeoutError"
          ? `No response within ${probeTimeoutMs}ms.`
          : "Connection refused.",
    };
  }
}

/**
 * Reads container state per compose service. Docker being absent or stopped is
 * an ordinary condition on a student laptop, not an error worth surfacing as a
 * failure, so it degrades to "state unknown".
 */
async function readDockerState() {
  const states = new Map<string, string>();

  try {
    const { stdout } = await execFileAsync(
      "docker",
      ["compose", "ps", "--all", "--format", "json"],
      { cwd: process.cwd(), timeout: dockerTimeoutMs, windowsHide: true },
    );

    for (const entry of parseComposePs(stdout)) {
      if (entry.Service) {
        states.set(entry.Service, String(entry.State ?? "unknown").toLowerCase());
      }
    }

    return { available: true, detail: "Docker Compose reachable.", states };
  } catch (error) {
    const message = (error as { stderr?: string; message?: string }).stderr ?? (error as Error).message ?? "";
    return {
      available: false,
      detail: message.includes("daemon")
        ? "Docker Desktop is installed but the engine is not running."
        : "Docker Compose is not available on this machine.",
      states,
    };
  }
}

type ComposePsEntry = { Service?: string; State?: string; Name?: string };

/**
 * Compose has emitted both a JSON array and newline-delimited objects across
 * versions, so accept either.
 */
function parseComposePs(stdout: string): ComposePsEntry[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed as ComposePsEntry[];
    return [parsed as ComposePsEntry];
  } catch {
    // Not a single JSON document, so treat it as one object per line.
  }

  const entries: ComposePsEntry[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as ComposePsEntry);
    } catch {
      // Ignore any non-JSON noise compose may interleave.
    }
  }
  return entries;
}

export type RestartOutcome = {
  ok: boolean;
  restarted: string[];
  message: string;
};

/**
 * Restarts one compose service, or all of them.
 *
 * `serviceName` is validated against the compose services declared in
 * challenges.ts before it is used, and the command is executed with an argument
 * array rather than a shell string, so request input can never become part of a
 * command line.
 */
export async function restartLabs(serviceName?: string): Promise<RestartOutcome> {
  const known = getKnownServiceNames();
  const targets = serviceName ? [serviceName] : known;

  if (serviceName && !known.includes(serviceName)) {
    return { ok: false, restarted: [], message: "Unknown lab service." };
  }

  try {
    await execFileAsync("docker", ["compose", "restart", ...targets], {
      cwd: process.cwd(),
      timeout: restartTimeoutMs,
      windowsHide: true,
    });

    // The next read must reflect the restart rather than the pre-restart cache.
    invalidateLabHealthCache();

    return {
      ok: true,
      restarted: targets,
      message:
        targets.length === 1
          ? `Restarted ${targets[0]}. It may take a few seconds to answer.`
          : `Restarted ${targets.length} labs. They may take a few seconds to answer.`,
    };
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? "";
    return {
      ok: false,
      restarted: [],
      message: stderr.includes("daemon")
        ? "Docker engine is not running. Start Docker Desktop and try again."
        : "Restart failed. Check the terminal running Docker for details.",
    };
  }
}
