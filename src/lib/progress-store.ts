import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { emptyProgress, type ProgressState, type StudentSession } from "./progress-types";

type ProgressDatabase = {
  sessions: Record<string, StudentSession>;
  progress: Record<string, ProgressState>;
};

type LoginInput = {
  name: string;
  usn?: string;
};

type AttemptInput = {
  sessionId: string;
  challengeId: string;
  flagPreview: string;
  correct: boolean;
};

const dataDir = path.join(process.cwd(), ".data");
const databasePath = path.join(dataDir, "vulnmentor-progress.json");

export async function createStudentSession(input: LoginInput) {
  const now = new Date().toISOString();
  const session: StudentSession = {
    id: randomUUID(),
    name: normalizeName(input.name),
    usn: normalizeUsn(input.usn),
    createdAt: now,
    lastSeenAt: now,
  };

  const database = await readDatabase();
  database.sessions[session.id] = session;
  database.progress[session.id] = emptyProgress;
  await writeDatabase(database);

  return {
    student: session,
    progress: database.progress[session.id],
  };
}

export async function getStudentSession(sessionId: string | null) {
  if (!sessionId) return null;

  const database = await readDatabase();
  const session = database.sessions[sessionId];
  if (!session) return null;

  session.lastSeenAt = new Date().toISOString();
  database.sessions[sessionId] = session;
  database.progress[sessionId] ??= emptyProgress;
  await writeDatabase(database);

  return {
    student: session,
    progress: database.progress[sessionId],
  };
}

export async function recordProgressAttempt(input: AttemptInput) {
  const database = await readDatabase();
  database.progress[input.sessionId] ??= emptyProgress;

  const current = database.progress[input.sessionId];
  const attempt = {
    id: `attempt-${Date.now()}-${randomUUID().slice(0, 8)}`,
    challengeId: input.challengeId,
    correct: input.correct,
    flagPreview: input.flagPreview,
    submittedAt: new Date().toISOString(),
  };

  const completed =
    input.correct && !current.completed.includes(input.challengeId)
      ? [...current.completed, input.challengeId]
      : current.completed;

  const nextProgress = {
    completed,
    attempts: [attempt, ...current.attempts].slice(0, 100),
  };

  database.progress[input.sessionId] = nextProgress;
  await writeDatabase(database);

  return nextProgress;
}

async function readDatabase(): Promise<ProgressDatabase> {
  try {
    const raw = await readFile(databasePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ProgressDatabase>;
    return {
      sessions: parsed.sessions ?? {},
      progress: parsed.progress ?? {},
    };
  } catch {
    return { sessions: {}, progress: {} };
  }
}

async function writeDatabase(database: ProgressDatabase) {
  await mkdir(dataDir, { recursive: true });
  const temporaryPath = `${databasePath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(database, null, 2));
  await rename(temporaryPath, databasePath);
}

function normalizeName(name: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return "Student";
  return clean.slice(0, 80);
}

function normalizeUsn(usn?: string) {
  return (usn ?? "").trim().toUpperCase().slice(0, 32);
}
