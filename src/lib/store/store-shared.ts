import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";
import type {
  GeneratedReportRecord,
  ProgressState,
  QuizAnswerRecord,
  StudentSession,
  UserRole,
} from "../progress-types";

/**
 * Everything both storage adapters need: shared record shapes, the security
 * rules that must behave identically no matter where rows live, and the
 * analytics aggregation. Adapters own persistence only.
 */

export type UserRecord = StudentSession & {
  passwordHash: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export type SessionResult = {
  session: SessionRecord;
  student: StudentSession;
  progress: ProgressState;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  usn?: string;
  role?: UserRole;
  instructorCode?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AttemptInput = {
  sessionId: string;
  challengeId: string;
  flagPreview: string;
  correct: boolean;
};

export type QuizInput = {
  sessionId: string;
  lessonSlug: string;
  score: number;
  total: number;
  answers: QuizAnswerRecord[];
};

export type HintInput = {
  sessionId: string;
  challengeId: string;
  hintIndex: number;
};

export type EvidenceInput = {
  sessionId: string;
  challengeId: string;
  normalRequest: string;
  modifiedRequest: string;
  vulnerableResponse: string;
  secureResponse: string;
  traceProof: string;
  impactSummary: string;
  rootCause: string;
  fixRecommendation: string;
};

export type ReportInput = {
  sessionId: string;
  challengeId: string;
  format: GeneratedReportRecord["format"];
  title: string;
};

export type DatabaseProvider = "json" | "sqlite" | "postgres" | "supabase";

/**
 * The public contract. Both adapters implement this, and progress-store.ts
 * forwards to whichever is active, so the rest of the app never learns which
 * storage engine is in use.
 */
export type ProgressStoreAdapter = {
  registerAccount(input: RegisterInput): Promise<SessionResult>;
  loginAccount(input: LoginInput): Promise<SessionResult>;
  getStudentSession(sessionId: string | null): Promise<SessionResult | null>;
  destroySession(sessionId: string | null): Promise<void>;
  recordProgressAttempt(input: AttemptInput): Promise<ProgressState | null>;
  recordQuizResult(input: QuizInput): Promise<ProgressState | null>;
  recordHintView(input: HintInput): Promise<ProgressState | null>;
  saveEvidenceNotebook(input: EvidenceInput): Promise<ProgressState | null>;
  recordGeneratedReport(input: ReportInput): Promise<ProgressState | null>;
  getInstructorAnalytics(): Promise<InstructorAnalytics>;
};

export const dataDir = path.join(process.cwd(), ".data");
export const jsonDatabasePath = path.join(dataDir, "vulnmentor-progress.json");
export const sqliteDatabasePath = path.join(dataDir, "vulnmentor.sqlite");
export const backupDir = path.join(dataDir, "backups");

export const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 14;
export const sessionTouchIntervalMs = 1000 * 60 * 5;

/**
 * A session also dies after this much inactivity, independent of its absolute
 * expiry. A cookie copied off a shared lab machine is otherwise valid for the
 * full fourteen days even if its owner never signs in again.
 */
export const sessionIdleTimeoutMs = 1000 * 60 * 60 * 24 * 3;

export const backupIntervalMs = 1000 * 60 * 15;
export const maxBackups = 20;

/**
 * Retention caps carried over from the JSON store. The SQLite adapter applies
 * them at read time so both engines return identically shaped progress.
 */
export const recordLimits = {
  attempts: 100,
  quizResults: 200,
  hintViews: 300,
  evidenceNotebooks: 200,
  reports: 200,
  quizAnswers: 20,
} as const;

const scrypt = promisify(scryptCallback);

/**
 * Password verification is always run against a real scrypt hash, even when the
 * email is unknown, so an attacker cannot tell registered accounts from
 * unregistered ones by timing the response.
 */
export const dummyPasswordHash = `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  if (expected.length === 0) return false;

  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function safeStringEqual(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Session ids are bearer tokens, so they carry more entropy than record ids. */
export function newSessionId() {
  return randomBytes(32).toString("hex");
}

export function newRecordId(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export function isExpired(session: SessionRecord, now = Date.now()) {
  if (new Date(session.expiresAt).getTime() < now) return true;
  return now - new Date(session.lastSeenAt).getTime() > sessionIdleTimeoutMs;
}

export function buildSession(userId: string): SessionRecord {
  const now = new Date();
  return {
    id: newSessionId(),
    userId,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + sessionLifetimeMs).toISOString(),
  };
}

export function validateRegistrationInput(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!email) {
    throw new Error("Email is required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  return { email, password };
}

export function resolveRegistrationRole(
  input: RegisterInput,
  email: string,
  existingUserCount: number,
): UserRole {
  if (input.role !== "instructor") return "student";

  const configuredCode = process.env.VULNMENTOR_INSTRUCTOR_CODE;

  // Bootstrap: the very first account on a fresh install may claim the
  // instructor role, but only while no code has been configured yet.
  if (existingUserCount === 0 && !configuredCode) {
    return "instructor";
  }

  // Demo automation still needs seeded instructors, but that path is an
  // explicit opt-in instead of anything that merely runs outside production.
  const demoSeedingEnabled = process.env.VULNMENTOR_ALLOW_TEST_INSTRUCTORS === "true";
  if (demoSeedingEnabled && process.env.NODE_ENV !== "production" && email.endsWith(".test")) {
    return "instructor";
  }

  if (!configuredCode) {
    throw new Error(
      "Instructor registration is disabled. Set VULNMENTOR_INSTRUCTOR_CODE to enable it.",
    );
  }

  if (!input.instructorCode || !safeStringEqual(input.instructorCode, configuredCode)) {
    throw new Error("Instructor registration requires a valid instructor code.");
  }

  return "instructor";
}

export function toSafeUser(user: UserRecord): StudentSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    usn: user.usn,
    role: user.role,
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt,
  };
}

export function normalizeName(name: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return "Student";
  return clean.slice(0, 80);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase().slice(0, 160);
}

export function normalizeUsn(usn?: string) {
  return (usn ?? "").trim().toUpperCase().slice(0, 32);
}

export function cleanLongText(value: string) {
  return value.trim().slice(0, 4000);
}

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export type InstructorAnalytics = ReturnType<typeof buildInstructorAnalytics>;

/**
 * Aggregation is shared so both engines report identical numbers. Instructor
 * accounts are excluded from every figure: counting their solves against a
 * student-only denominator used to push completion above 100%.
 */
export function buildInstructorAnalytics(
  allUsers: StudentSession[],
  progressByStudentId: Map<string, ProgressState>,
  totalChallenges: number,
) {
  const students = allUsers.filter((user) => user.role === "student");
  const progressByStudent = students.map((student) => ({
    userId: student.id,
    progress: progressByStudentId.get(student.id) ?? emptyProgressValue(),
  }));

  const activeCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const activeStudents = students.filter(
    (user) => new Date(user.lastSeenAt).getTime() >= activeCutoff,
  );
  const totalLabSlots = Math.max(1, students.length * totalChallenges);
  const solvedCount = progressByStudent.reduce(
    (sum, item) => sum + item.progress.completed.length,
    0,
  );
  const attempts = progressByStudent.flatMap((item) =>
    item.progress.attempts.map((attempt) => ({ ...attempt, userId: item.userId })),
  );
  const quizResults = progressByStudent.flatMap((item) =>
    item.progress.quizResults.map((quiz) => ({ ...quiz, userId: item.userId })),
  );
  const hintViews = progressByStudent.flatMap((item) =>
    item.progress.hintViews.map((hint) => ({ ...hint, userId: item.userId })),
  );

  const labFailures = new Map<string, number>();
  for (const attempt of attempts) {
    if (!attempt.correct) {
      labFailures.set(attempt.challengeId, (labFailures.get(attempt.challengeId) ?? 0) + 1);
    }
  }

  const hintCounts = new Map<string, number>();
  for (const hint of hintViews) {
    hintCounts.set(hint.challengeId, (hintCounts.get(hint.challengeId) ?? 0) + 1);
  }

  const studentRows = students.map((student) => {
    const progress = progressByStudentId.get(student.id) ?? emptyProgressValue();
    const correctAttempts = progress.attempts.filter((attempt) => attempt.correct).length;
    const quizScore = average(
      progress.quizResults.map((quiz) => Math.round((quiz.score / Math.max(quiz.total, 1)) * 100)),
    );
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      lastSeenAt: student.lastSeenAt,
      completedLabs: progress.completed.length,
      attempts: progress.attempts.length,
      accuracy: progress.attempts.length
        ? Math.round((correctAttempts / progress.attempts.length) * 100)
        : 0,
      averageQuizScore: quizScore,
    };
  });

  return {
    totalStudents: students.length,
    activeStudents: activeStudents.length,
    labCompletionPercentage: Math.min(100, Math.round((solvedCount / totalLabSlots) * 100)),
    mostFailedLabs: Array.from(labFailures.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([challengeId, failures]) => ({ challengeId, failures })),
    mostUsedHints: Array.from(hintCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([challengeId, hints]) => ({ challengeId, hints })),
    averageQuizScore: average(
      quizResults.map((quiz) => Math.round((quiz.score / Math.max(quiz.total, 1)) * 100)),
    ),
    recentAttempts: attempts
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 12),
    studentRows,
    ignoredInstructorAccounts: allUsers.length - students.length,
  };
}

function emptyProgressValue(): ProgressState {
  return {
    completed: [],
    attempts: [],
    quizResults: [],
    hintViews: [],
    evidenceNotebooks: [],
    reports: [],
  };
}
