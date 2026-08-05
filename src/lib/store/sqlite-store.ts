import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { challenges } from "@/data/challenges";
import type {
  AttemptRecord,
  EvidenceNotebookRecord,
  GeneratedReportRecord,
  HintUsageRecord,
  ProgressState,
  QuizAnswerRecord,
  QuizResultRecord,
  StudentSession,
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
  maxBackups,
  newRecordId,
  normalizeEmail,
  normalizeName,
  normalizeUsn,
  recordLimits,
  resolveRegistrationRole,
  sessionIdleTimeoutMs,
  sessionTouchIntervalMs,
  sqliteDatabasePath,
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

/**
 * SQLite adapter.
 *
 * Concurrency is handled by the engine rather than by the promise queue the
 * JSON adapter needs. better-sqlite3 is synchronous, so a statement cannot be
 * interleaved by the event loop, and every multi-statement mutation runs inside
 * a transaction that either commits whole or rolls back. WAL mode plus a busy
 * timeout extends the same guarantee across processes, which the in-process
 * mutex could never do.
 */

type Db = Database.Database;

let database: Db | null = null;
let statementCache = new Map<string, Database.Statement>();
let lastBackupAt = 0;

export const sqliteStore: ProgressStoreAdapter = {
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

export function getDatabase(): Db {
  if (database) return database;

  mkdirSync(dataDir, { recursive: true });
  const db = new Database(sqliteDatabasePath);

  // WAL lets readers continue during a write; NORMAL is the durable-enough
  // companion for it. The busy timeout replaces "database is locked" errors
  // with a short wait when another process holds the write lock.
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  db.exec(readSchemaSql());

  database = db;
  statementCache = new Map();
  return db;
}

export function closeDatabase() {
  database?.close();
  database = null;
  statementCache = new Map();
}

export function sqliteDatabaseExists() {
  return existsSync(sqliteDatabasePath);
}

function readSchemaSql() {
  return readFileSync(path.join(process.cwd(), "src", "lib", "store", "schema.sql"), "utf8");
}

function sql(query: string) {
  const cached = statementCache.get(query);
  if (cached) return cached;

  const statement = getDatabase().prepare(query);
  statementCache.set(query, statement);
  return statement;
}

function transaction<T>(work: () => T): T {
  return getDatabase().transaction(work)();
}

async function registerAccount(input: RegisterInput) {
  const { email, password } = validateRegistrationInput(input);

  // scrypt runs before the transaction opens so a slow hash never holds the
  // write lock against other students.
  const passwordHash = await hashPassword(password);

  scheduleBackup();

  return transaction(() => {
    if (findUserByEmail(email)) {
      throw new Error("An account with this email already exists.");
    }

    const userCount = (sql("SELECT COUNT(*) AS total FROM users").get() as { total: number }).total;
    const role = resolveRegistrationRole(input, email, userCount);
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

    sql(
      `INSERT INTO users (id, name, email, usn, role, password_hash, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(user.id, user.name, user.email, user.usn, user.role, user.passwordHash, now, now);

    return createSessionForUser(user);
  });
}

async function loginAccount(input: LoginInput) {
  const user = findUserByEmail(normalizeEmail(input.email));
  const passwordMatches = await verifyPassword(
    input.password,
    user?.passwordHash ?? dummyPasswordHash,
  );

  if (!user || !passwordMatches) {
    throw new Error("Invalid email or password.");
  }

  scheduleBackup();
  return transaction(() => createSessionForUser(user));
}

async function getStudentSession(sessionId: string | null) {
  if (!sessionId) return null;

  const session = findSession(sessionId);
  if (!session) return null;

  const user = findUserById(session.userId);
  const now = Date.now();

  if (!user || isSessionExpired(session, now)) {
    sql("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }

  // Throttled so an active student does not generate a write per page render.
  if (now - new Date(session.lastSeenAt).getTime() > sessionTouchIntervalMs) {
    const stamp = new Date(now).toISOString();
    transaction(() => {
      sql("UPDATE sessions SET last_seen_at = ? WHERE id = ?").run(stamp, sessionId);
      sql("UPDATE users SET last_seen_at = ? WHERE id = ?").run(stamp, user.id);
    });
    session.lastSeenAt = stamp;
    user.lastSeenAt = stamp;
  }

  return {
    session,
    student: toSafeUser(user),
    progress: readProgress(user.id),
  };
}

async function destroySession(sessionId: string | null) {
  if (!sessionId) return;
  sql("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

async function recordProgressAttempt(input: AttemptInput) {
  scheduleBackup();

  return transaction(() => {
    const userId = resolveSessionUserId(input.sessionId);
    if (!userId) return null;

    const submittedAt = new Date().toISOString();
    sql(
      `INSERT INTO attempts (id, user_id, challenge_id, correct, flag_preview, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      newRecordId("attempt"),
      userId,
      input.challengeId,
      input.correct ? 1 : 0,
      input.flagPreview,
      submittedAt,
    );

    if (input.correct) {
      sql(
        `INSERT INTO completed_labs (user_id, challenge_id, completed_at)
         VALUES (?, ?, ?)
         ON CONFLICT (user_id, challenge_id) DO NOTHING`,
      ).run(userId, input.challengeId, submittedAt);
    }

    return readProgress(userId);
  });
}

async function recordQuizResult(input: QuizInput) {
  scheduleBackup();

  return transaction(() => {
    const userId = resolveSessionUserId(input.sessionId);
    if (!userId) return null;

    const total = Math.max(1, input.total);

    // A retake replaces the previous score for that lesson, matching how the
    // JSON store filtered the old entry out before prepending the new one.
    sql(
      `INSERT INTO quiz_results (id, user_id, lesson_slug, score, total, answers, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, lesson_slug) DO UPDATE SET
         score = excluded.score,
         total = excluded.total,
         answers = excluded.answers,
         submitted_at = excluded.submitted_at`,
    ).run(
      newRecordId("quiz"),
      userId,
      input.lessonSlug,
      clampNumber(input.score, 0, total),
      total,
      JSON.stringify(input.answers.slice(0, recordLimits.quizAnswers)),
      new Date().toISOString(),
    );

    return readProgress(userId);
  });
}

async function recordHintView(input: HintInput) {
  scheduleBackup();

  return transaction(() => {
    const userId = resolveSessionUserId(input.sessionId);
    if (!userId) return null;

    sql(
      `INSERT INTO hint_views (id, user_id, challenge_id, hint_index, viewed_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      newRecordId("hint"),
      userId,
      input.challengeId,
      clampNumber(input.hintIndex, 1, 20),
      new Date().toISOString(),
    );

    return readProgress(userId);
  });
}

async function saveEvidenceNotebook(input: EvidenceInput) {
  scheduleBackup();

  return transaction(() => {
    const userId = resolveSessionUserId(input.sessionId);
    if (!userId) return null;

    sql(
      `INSERT INTO evidence_notebooks (
         id, user_id, challenge_id, normal_request, modified_request,
         vulnerable_response, secure_response, trace_proof, impact_summary,
         root_cause, fix_recommendation, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, challenge_id) DO UPDATE SET
         normal_request = excluded.normal_request,
         modified_request = excluded.modified_request,
         vulnerable_response = excluded.vulnerable_response,
         secure_response = excluded.secure_response,
         trace_proof = excluded.trace_proof,
         impact_summary = excluded.impact_summary,
         root_cause = excluded.root_cause,
         fix_recommendation = excluded.fix_recommendation,
         updated_at = excluded.updated_at`,
    ).run(
      newRecordId("evidence"),
      userId,
      input.challengeId,
      cleanLongText(input.normalRequest),
      cleanLongText(input.modifiedRequest),
      cleanLongText(input.vulnerableResponse),
      cleanLongText(input.secureResponse),
      cleanLongText(input.traceProof),
      cleanLongText(input.impactSummary),
      cleanLongText(input.rootCause),
      cleanLongText(input.fixRecommendation),
      new Date().toISOString(),
    );

    return readProgress(userId);
  });
}

async function recordGeneratedReport(input: ReportInput) {
  scheduleBackup();

  return transaction(() => {
    const userId = resolveSessionUserId(input.sessionId);
    if (!userId) return null;

    sql(
      `INSERT INTO reports (id, user_id, challenge_id, format, title, generated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      newRecordId("report"),
      userId,
      input.challengeId,
      input.format,
      input.title.slice(0, 140),
      new Date().toISOString(),
    );

    return readProgress(userId);
  });
}

async function getInstructorAnalytics() {
  const users = (
    sql(
      `SELECT id, name, email, usn, role, created_at, last_seen_at FROM users`,
    ).all() as UserRow[]
  ).map(toStudentSession);

  const progressByStudentId = new Map<string, ProgressState>();
  for (const user of users) {
    if (user.role === "student") {
      progressByStudentId.set(user.id, readProgress(user.id));
    }
  }

  return buildInstructorAnalytics(users, progressByStudentId, challenges.length);
}

function createSessionForUser(user: UserRecord) {
  const session = buildSession(user.id);

  sql(
    `INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(session.id, session.userId, session.createdAt, session.lastSeenAt, session.expiresAt);

  sql("UPDATE users SET last_seen_at = ? WHERE id = ?").run(session.createdAt, user.id);
  pruneExpiredSessions();

  return {
    session,
    student: toSafeUser({ ...user, lastSeenAt: session.createdAt }),
    progress: readProgress(user.id),
  };
}

/** Validates a session and returns the owning user id, or null. */
function resolveSessionUserId(sessionId: string) {
  const session = findSession(sessionId);
  if (!session || isSessionExpired(session)) return null;

  const exists = sql("SELECT 1 AS present FROM users WHERE id = ?").get(session.userId);
  return exists ? session.userId : null;
}

function isSessionExpired(session: SessionRecord, now = Date.now()) {
  if (new Date(session.expiresAt).getTime() < now) return true;
  return now - new Date(session.lastSeenAt).getTime() > sessionIdleTimeoutMs;
}

function pruneExpiredSessions() {
  const now = Date.now();
  sql("DELETE FROM sessions WHERE expires_at < ? OR last_seen_at < ?").run(
    new Date(now).toISOString(),
    new Date(now - sessionIdleTimeoutMs).toISOString(),
  );
}

/**
 * Rows are kept indefinitely; the JSON store's caps are applied here at read
 * time instead. That keeps the returned shape identical while ending the old
 * behaviour of permanently discarding a student's older attempts.
 */
function readProgress(userId: string): ProgressState {
  const completed = (
    sql(
      "SELECT challenge_id FROM completed_labs WHERE user_id = ? ORDER BY rowid ASC",
    ).all(userId) as Array<{ challenge_id: string }>
  ).map((row) => row.challenge_id);

  const attempts = (
    sql(
      `SELECT id, challenge_id, correct, flag_preview, submitted_at
       FROM attempts WHERE user_id = ?
       ORDER BY submitted_at DESC, rowid DESC LIMIT ?`,
    ).all(userId, recordLimits.attempts) as AttemptRow[]
  ).map(toAttemptRecord);

  const quizResults = (
    sql(
      `SELECT id, lesson_slug, score, total, answers, submitted_at
       FROM quiz_results WHERE user_id = ?
       ORDER BY submitted_at DESC, rowid DESC LIMIT ?`,
    ).all(userId, recordLimits.quizResults) as QuizRow[]
  ).map(toQuizRecord);

  const hintViews = (
    sql(
      `SELECT id, challenge_id, hint_index, viewed_at
       FROM hint_views WHERE user_id = ?
       ORDER BY viewed_at DESC, rowid DESC LIMIT ?`,
    ).all(userId, recordLimits.hintViews) as HintRow[]
  ).map(toHintRecord);

  const evidenceNotebooks = (
    sql(
      `SELECT id, challenge_id, normal_request, modified_request, vulnerable_response,
              secure_response, trace_proof, impact_summary, root_cause,
              fix_recommendation, updated_at
       FROM evidence_notebooks WHERE user_id = ?
       ORDER BY updated_at DESC, rowid DESC LIMIT ?`,
    ).all(userId, recordLimits.evidenceNotebooks) as EvidenceRow[]
  ).map(toEvidenceRecord);

  const reports = (
    sql(
      `SELECT id, challenge_id, format, title, generated_at
       FROM reports WHERE user_id = ?
       ORDER BY generated_at DESC, rowid DESC LIMIT ?`,
    ).all(userId, recordLimits.reports) as ReportRow[]
  ).map(toReportRecord);

  return { completed, attempts, quizResults, hintViews, evidenceNotebooks, reports };
}

function findUserByEmail(email: string): UserRecord | null {
  const row = sql(
    `SELECT id, name, email, usn, role, password_hash, created_at, last_seen_at
     FROM users WHERE email = ?`,
  ).get(email) as (UserRow & { password_hash: string }) | undefined;

  return row ? toUserRecord(row) : null;
}

function findUserById(id: string): UserRecord | null {
  const row = sql(
    `SELECT id, name, email, usn, role, password_hash, created_at, last_seen_at
     FROM users WHERE id = ?`,
  ).get(id) as (UserRow & { password_hash: string }) | undefined;

  return row ? toUserRecord(row) : null;
}

function findSession(sessionId: string): SessionRecord | null {
  const row = sql(
    "SELECT id, user_id, created_at, last_seen_at, expires_at FROM sessions WHERE id = ?",
  ).get(sessionId) as SessionRow | undefined;

  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
  };
}

function scheduleBackup() {
  if (Date.now() - lastBackupAt < backupIntervalMs) return;
  lastBackupAt = Date.now();
  void runBackup();
}

/**
 * Uses SQLite's online backup API, which produces a consistent snapshot even
 * while writes are in flight. A failure is logged rather than thrown: losing a
 * snapshot must not fail a student's flag submission.
 */
async function runBackup() {
  try {
    await mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await getDatabase().backup(path.join(backupDir, `vulnmentor-${stamp}.sqlite`));

    const entries = (await readdir(backupDir))
      .filter((name) => name.startsWith("vulnmentor-") && name.endsWith(".sqlite"))
      .sort();

    for (const stale of entries.slice(0, Math.max(0, entries.length - maxBackups))) {
      await unlink(path.join(backupDir, stale)).catch(() => undefined);
    }
  } catch (error) {
    console.warn("[vulnmentor] sqlite backup failed:", error);
  }
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  usn: string;
  role: string;
  created_at: string;
  last_seen_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
};

type AttemptRow = {
  id: string;
  challenge_id: string;
  correct: number;
  flag_preview: string;
  submitted_at: string;
};

type QuizRow = {
  id: string;
  lesson_slug: string;
  score: number;
  total: number;
  answers: string;
  submitted_at: string;
};

type HintRow = {
  id: string;
  challenge_id: string;
  hint_index: number;
  viewed_at: string;
};

type EvidenceRow = {
  id: string;
  challenge_id: string;
  normal_request: string;
  modified_request: string;
  vulnerable_response: string;
  secure_response: string;
  trace_proof: string;
  impact_summary: string;
  root_cause: string;
  fix_recommendation: string;
  updated_at: string;
};

type ReportRow = {
  id: string;
  challenge_id: string;
  format: string;
  title: string;
  generated_at: string;
};

function toStudentSession(row: UserRow): StudentSession {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    usn: row.usn,
    role: row.role === "instructor" ? "instructor" : "student",
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

function toUserRecord(row: UserRow & { password_hash: string }): UserRecord {
  return { ...toStudentSession(row), passwordHash: row.password_hash };
}

function toAttemptRecord(row: AttemptRow): AttemptRecord {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    correct: row.correct === 1,
    flagPreview: row.flag_preview,
    submittedAt: row.submitted_at,
  };
}

function toQuizRecord(row: QuizRow): QuizResultRecord {
  return {
    id: row.id,
    lessonSlug: row.lesson_slug,
    score: row.score,
    total: row.total,
    answers: parseAnswers(row.answers),
    submittedAt: row.submitted_at,
  };
}

function parseAnswers(raw: string): QuizAnswerRecord[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toHintRecord(row: HintRow): HintUsageRecord {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    hintIndex: row.hint_index,
    viewedAt: row.viewed_at,
  };
}

function toEvidenceRecord(row: EvidenceRow): EvidenceNotebookRecord {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    normalRequest: row.normal_request,
    modifiedRequest: row.modified_request,
    vulnerableResponse: row.vulnerable_response,
    secureResponse: row.secure_response,
    traceProof: row.trace_proof,
    impactSummary: row.impact_summary,
    rootCause: row.root_cause,
    fixRecommendation: row.fix_recommendation,
    updatedAt: row.updated_at,
  };
}

function toReportRecord(row: ReportRow): GeneratedReportRecord {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    format: row.format as GeneratedReportRecord["format"],
    title: row.title,
    generatedAt: row.generated_at,
  };
}
