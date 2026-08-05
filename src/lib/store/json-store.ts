import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { challenges } from "@/data/challenges";
import {
  createEmptyProgress,
  type EvidenceNotebookRecord,
  type GeneratedReportRecord,
  type HintUsageRecord,
  type ProgressState,
  type QuizResultRecord,
  type StudentSession,
} from "../progress-types";
import {
  backupDir,
  backupIntervalMs,
  buildInstructorAnalytics,
  buildSession,
  cleanLongText,
  clampNumber,
  dataDir,
  dummyPasswordHash,
  hashPassword,
  isExpired,
  jsonDatabasePath,
  maxBackups,
  newRecordId,
  normalizeEmail,
  normalizeName,
  normalizeUsn,
  recordLimits,
  resolveRegistrationRole,
  sessionTouchIntervalMs,
  toSafeUser,
  validateRegistrationInput,
  verifyPassword,
  type AttemptInput,
  type EvidenceInput,
  type HintInput,
  type LoginInput,
  type ProgressStoreAdapter,
  type QuizInput,
  type RegisterInput,
  type ReportInput,
  type SessionRecord,
  type UserRecord,
} from "./store-shared";

type ProgressDatabase = {
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
  progress: Record<string, ProgressState>;
};

/**
 * Lets a mutator opt out of persisting when it made no change (for example when
 * the caller presented an unknown session id). Without this every rejected
 * request would still rewrite the whole database file.
 */
type WriteContext = { commit: boolean };

/**
 * Serializes every read-modify-write cycle. Node serves requests concurrently,
 * so two students submitting at the same moment would otherwise both read the
 * same snapshot and the second write would silently discard the first.
 */
let writeQueue: Promise<unknown> = Promise.resolve();
let lastBackupAt = 0;

export const jsonStore: ProgressStoreAdapter = {
  registerAccount,
  loginAccount,
  getStudentSession,
  destroySession,
  recordProgressAttempt,
  recordQuizResult,
  recordHintView,
  saveEvidenceNotebook,
  recordGeneratedReport,
  getInstructorAnalytics,
};

async function registerAccount(input: RegisterInput) {
  const { email, password } = validateRegistrationInput(input);

  // Hashing is deliberately done before the lock is taken: scrypt is slow and
  // holding the write queue for its duration would stall every other request.
  const passwordHash = await hashPassword(password);

  return withDatabaseWrite((database) => {
    if (findUserByEmail(database, email)) {
      throw new Error("An account with this email already exists.");
    }

    const role = resolveRegistrationRole(input, email, Object.keys(database.users).length);
    const now = new Date().toISOString();
    const user: UserRecord = {
      id: randomUUID(),
      name: normalizeName(input.name),
      email,
      usn: normalizeUsn(input.usn),
      role,
      passwordHash,
      createdAt: now,
      lastSeenAt: now,
    };

    database.users[user.id] = user;
    database.progress[user.id] = createEmptyProgress();

    return createSessionForUser(database, user.id);
  });
}

async function loginAccount(input: LoginInput) {
  const database = await readDatabase();
  const user = findUserByEmail(database, normalizeEmail(input.email));
  const passwordMatches = await verifyPassword(
    input.password,
    user?.passwordHash ?? dummyPasswordHash,
  );

  if (!user || !passwordMatches) {
    throw new Error("Invalid email or password.");
  }

  return withDatabaseWrite((current) => createSessionForUser(current, user.id));
}

async function getStudentSession(sessionId: string | null) {
  if (!sessionId) return null;

  const database = await readDatabase();
  const session = database.sessions[sessionId];
  if (!session) return null;

  const user = database.users[session.userId];

  if (isExpired(session) || !user) {
    await withDatabaseWrite((current, context) => {
      if (!current.sessions[sessionId]) {
        context.commit = false;
        return;
      }
      delete current.sessions[sessionId];
    });
    return null;
  }

  // Only touch the timestamps periodically. Refreshing them on every request
  // meant a full database rewrite for each page render and widened the window
  // for concurrent writes to collide.
  if (Date.now() - new Date(session.lastSeenAt).getTime() > sessionTouchIntervalMs) {
    await withDatabaseWrite((current, context) => {
      const storedSession = current.sessions[sessionId];
      const storedUser = storedSession ? current.users[storedSession.userId] : undefined;

      if (!storedSession || !storedUser) {
        context.commit = false;
        return;
      }

      const now = new Date().toISOString();
      storedSession.lastSeenAt = now;
      storedUser.lastSeenAt = now;
    });
  }

  return {
    session,
    student: toSafeUser(user),
    progress: normalizeProgress(database.progress[user.id]),
  };
}

async function destroySession(sessionId: string | null) {
  if (!sessionId) return;

  await withDatabaseWrite((database, context) => {
    if (!database.sessions[sessionId]) {
      context.commit = false;
      return;
    }
    delete database.sessions[sessionId];
  });
}

async function recordProgressAttempt(input: AttemptInput) {
  return withDatabaseWrite((database, context) => {
    const userId = resolveSessionUserId(database, input.sessionId);
    if (!userId) {
      context.commit = false;
      return null;
    }

    const current = normalizeProgress(database.progress[userId]);
    const attempt = {
      id: newRecordId("attempt"),
      challengeId: input.challengeId,
      correct: input.correct,
      flagPreview: input.flagPreview,
      submittedAt: new Date().toISOString(),
    };

    const completed =
      input.correct && !current.completed.includes(input.challengeId)
        ? [...current.completed, input.challengeId]
        : current.completed;

    const nextProgress: ProgressState = {
      ...current,
      completed,
      attempts: [attempt, ...current.attempts].slice(0, recordLimits.attempts),
    };

    database.progress[userId] = nextProgress;
    return nextProgress;
  });
}

async function recordQuizResult(input: QuizInput) {
  return withDatabaseWrite((database, context) => {
    const userId = resolveSessionUserId(database, input.sessionId);
    if (!userId) {
      context.commit = false;
      return null;
    }

    const current = normalizeProgress(database.progress[userId]);
    const total = Math.max(1, input.total);
    const result: QuizResultRecord = {
      id: newRecordId("quiz"),
      lessonSlug: input.lessonSlug,
      score: clampNumber(input.score, 0, total),
      total,
      answers: input.answers.slice(0, recordLimits.quizAnswers),
      submittedAt: new Date().toISOString(),
    };

    database.progress[userId] = {
      ...current,
      quizResults: [
        result,
        ...current.quizResults.filter((item) => item.lessonSlug !== input.lessonSlug),
      ].slice(0, recordLimits.quizResults),
    };

    return database.progress[userId];
  });
}

async function recordHintView(input: HintInput) {
  return withDatabaseWrite((database, context) => {
    const userId = resolveSessionUserId(database, input.sessionId);
    if (!userId) {
      context.commit = false;
      return null;
    }

    const current = normalizeProgress(database.progress[userId]);
    const hint: HintUsageRecord = {
      id: newRecordId("hint"),
      challengeId: input.challengeId,
      hintIndex: clampNumber(input.hintIndex, 1, 20),
      viewedAt: new Date().toISOString(),
    };

    database.progress[userId] = {
      ...current,
      hintViews: [hint, ...current.hintViews].slice(0, recordLimits.hintViews),
    };

    return database.progress[userId];
  });
}

async function saveEvidenceNotebook(input: EvidenceInput) {
  return withDatabaseWrite((database, context) => {
    const userId = resolveSessionUserId(database, input.sessionId);
    if (!userId) {
      context.commit = false;
      return null;
    }

    const current = normalizeProgress(database.progress[userId]);
    const existing = current.evidenceNotebooks.find(
      (item) => item.challengeId === input.challengeId,
    );
    const note: EvidenceNotebookRecord = {
      id: existing?.id ?? newRecordId("evidence"),
      challengeId: input.challengeId,
      normalRequest: cleanLongText(input.normalRequest),
      modifiedRequest: cleanLongText(input.modifiedRequest),
      vulnerableResponse: cleanLongText(input.vulnerableResponse),
      secureResponse: cleanLongText(input.secureResponse),
      traceProof: cleanLongText(input.traceProof),
      impactSummary: cleanLongText(input.impactSummary),
      rootCause: cleanLongText(input.rootCause),
      fixRecommendation: cleanLongText(input.fixRecommendation),
      updatedAt: new Date().toISOString(),
    };

    database.progress[userId] = {
      ...current,
      evidenceNotebooks: [
        note,
        ...current.evidenceNotebooks.filter((item) => item.challengeId !== input.challengeId),
      ].slice(0, recordLimits.evidenceNotebooks),
    };

    return database.progress[userId];
  });
}

async function recordGeneratedReport(input: ReportInput) {
  return withDatabaseWrite((database, context) => {
    const userId = resolveSessionUserId(database, input.sessionId);
    if (!userId) {
      context.commit = false;
      return null;
    }

    const current = normalizeProgress(database.progress[userId]);
    const report: GeneratedReportRecord = {
      id: newRecordId("report"),
      challengeId: input.challengeId,
      format: input.format,
      title: input.title.slice(0, 140),
      generatedAt: new Date().toISOString(),
    };

    database.progress[userId] = {
      ...current,
      reports: [report, ...current.reports].slice(0, recordLimits.reports),
    };

    return database.progress[userId];
  });
}

async function getInstructorAnalytics() {
  const database = await readDatabase();
  const users: StudentSession[] = Object.values(database.users).map(toSafeUser);
  const progressByStudentId = new Map(
    Object.entries(database.progress).map(([userId, progress]) => [
      userId,
      normalizeProgress(progress),
    ]),
  );

  return buildInstructorAnalytics(users, progressByStudentId, challenges.length);
}

function createSessionForUser(database: ProgressDatabase, userId: string) {
  const user = database.users[userId];
  const session = buildSession(userId);

  user.lastSeenAt = session.createdAt;
  database.sessions[session.id] = session;
  database.progress[user.id] ??= createEmptyProgress();

  return {
    session,
    student: toSafeUser(user),
    progress: normalizeProgress(database.progress[user.id]),
  };
}

/**
 * Validates a session against an already-locked snapshot and returns the owning
 * user id. Callers used to re-read the database after checking the session,
 * which made every mutation a non-atomic read-check-read-write.
 */
function resolveSessionUserId(database: ProgressDatabase, sessionId: string) {
  const session = database.sessions[sessionId];
  if (!session || isExpired(session)) return null;

  const user = database.users[session.userId];
  if (!user) return null;

  database.progress[user.id] ??= createEmptyProgress();
  return user.id;
}

function withDatabaseWrite<T>(
  mutator: (database: ProgressDatabase, context: WriteContext) => T,
): Promise<T> {
  const run = writeQueue.then(async () => {
    const database = await readDatabase();
    const context: WriteContext = { commit: true };
    const result = mutator(database, context);

    if (context.commit) {
      pruneExpiredSessions(database);
      await writeDatabase(database);
    }

    return result;
  });

  // The queue must keep flowing even when a mutator throws, otherwise one
  // rejected registration would deadlock every later write.
  writeQueue = run.catch(() => undefined);
  return run;
}

function findUserByEmail(database: ProgressDatabase, email: string) {
  return Object.values(database.users).find((user) => user.email === email) ?? null;
}

function pruneExpiredSessions(database: ProgressDatabase) {
  for (const [sessionId, session] of Object.entries(database.sessions)) {
    if (isExpired(session) || !database.users[session.userId]) {
      delete database.sessions[sessionId];
    }
  }
}

async function readDatabase(): Promise<ProgressDatabase> {
  let raw: string;

  try {
    raw = await readFile(jsonDatabasePath, "utf8");
  } catch (error) {
    // A missing file is the expected state on a fresh install. Every other read
    // failure (a locked file, a permissions problem) must surface: callers write
    // back whatever this returns, so answering "empty" would erase every
    // account on the first transient error.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { users: {}, sessions: {}, progress: {} };
    }
    throw error;
  }

  const parsed = JSON.parse(raw) as Partial<ProgressDatabase>;
  return {
    users: parsed.users ?? {},
    sessions: parsed.sessions ?? {},
    progress: Object.fromEntries(
      Object.entries(parsed.progress ?? {}).map(([userId, progress]) => [
        userId,
        normalizeProgress(progress),
      ]),
    ),
  };
}

function normalizeProgress(progress: Partial<ProgressState> | undefined): ProgressState {
  return {
    completed: Array.isArray(progress?.completed) ? progress.completed : [],
    attempts: Array.isArray(progress?.attempts) ? progress.attempts : [],
    quizResults: Array.isArray(progress?.quizResults) ? progress.quizResults : [],
    hintViews: Array.isArray(progress?.hintViews) ? progress.hintViews : [],
    evidenceNotebooks: Array.isArray(progress?.evidenceNotebooks)
      ? progress.evidenceNotebooks
      : [],
    reports: Array.isArray(progress?.reports) ? progress.reports : [],
  };
}

async function writeDatabase(database: ProgressDatabase) {
  await mkdir(dataDir, { recursive: true });
  await backupIfDue();
  // A unique temp name keeps two writers from sharing one scratch file.
  const temporaryPath = `${jsonDatabasePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(database, null, 2));
  await rename(temporaryPath, jsonDatabasePath);
}

/**
 * Snapshots the last good database before it is overwritten. Called from inside
 * the write queue, so snapshots never interleave with a write. A backup failure
 * is logged rather than thrown: losing a snapshot must not fail a student's
 * flag submission.
 */
async function backupIfDue() {
  if (Date.now() - lastBackupAt < backupIntervalMs) return;
  lastBackupAt = Date.now();

  try {
    const existing = await readFile(jsonDatabasePath, "utf8");
    await mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await writeFile(path.join(backupDir, `vulnmentor-progress-${stamp}.json`), existing);
    await pruneBackups();
  } catch (error) {
    // Nothing to snapshot on a fresh install.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    console.warn("[vulnmentor] progress backup failed:", error);
  }
}

async function pruneBackups() {
  const entries = (await readdir(backupDir))
    .filter((name) => name.startsWith("vulnmentor-progress-") && name.endsWith(".json"))
    .sort();

  for (const stale of entries.slice(0, Math.max(0, entries.length - maxBackups))) {
    await unlink(path.join(backupDir, stale)).catch(() => undefined);
  }
}
