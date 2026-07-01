import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  emptyProgress,
  type EvidenceNotebookRecord,
  type GeneratedReportRecord,
  type HintUsageRecord,
  type ProgressState,
  type QuizAnswerRecord,
  type QuizResultRecord,
  type StudentSession,
  type UserRole,
} from "./progress-types";
import { challenges } from "@/data/challenges";

type UserRecord = StudentSession & {
  passwordHash: string;
};

type SessionRecord = {
  id: string;
  userId: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

type ProgressDatabase = {
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
  progress: Record<string, ProgressState>;
};

export type DatabaseProvider = "json" | "sqlite" | "postgres" | "supabase";

export type DatabaseAdapterStatus = {
  provider: DatabaseProvider;
  activeProvider: "json";
  readyForMigration: boolean;
  models: string[];
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  usn?: string;
  role?: UserRole;
  instructorCode?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AttemptInput = {
  sessionId: string;
  challengeId: string;
  flagPreview: string;
  correct: boolean;
};

type QuizInput = {
  sessionId: string;
  lessonSlug: string;
  score: number;
  total: number;
  answers: QuizAnswerRecord[];
};

type HintInput = {
  sessionId: string;
  challengeId: string;
  hintIndex: number;
};

type EvidenceInput = {
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

type ReportInput = {
  sessionId: string;
  challengeId: string;
  format: GeneratedReportRecord["format"];
  title: string;
};

const scrypt = promisify(scryptCallback);
const dataDir = path.join(process.cwd(), ".data");
const databasePath = path.join(dataDir, "vulnmentor-progress.json");
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 14;

export async function registerAccount(input: RegisterInput) {
  const database = await readDatabase();
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!email) {
    throw new Error("Email is required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (findUserByEmail(database, email)) {
    throw new Error("An account with this email already exists.");
  }

  const role = resolveRegistrationRole(database, input);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: randomUUID(),
    name: normalizeName(input.name),
    email,
    usn: normalizeUsn(input.usn),
    role,
    passwordHash: await hashPassword(password),
    createdAt: now,
    lastSeenAt: now,
  };

  database.users[user.id] = user;
  database.progress[user.id] = emptyProgress;
  await writeDatabase(database);

  return createSessionForUser(database, user.id);
}

export async function loginAccount(input: LoginInput) {
  const database = await readDatabase();
  const user = findUserByEmail(database, normalizeEmail(input.email));

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new Error("Invalid email or password.");
  }

  return createSessionForUser(database, user.id);
}

export async function getStudentSession(sessionId: string | null) {
  if (!sessionId) return null;

  const database = await readDatabase();
  const session = database.sessions[sessionId];
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete database.sessions[sessionId];
    await writeDatabase(database);
    return null;
  }

  const user = database.users[session.userId];
  if (!user) {
    delete database.sessions[sessionId];
    await writeDatabase(database);
    return null;
  }

  const now = new Date().toISOString();
  session.lastSeenAt = now;
  user.lastSeenAt = now;
  database.sessions[sessionId] = session;
  database.users[user.id] = user;
  database.progress[user.id] ??= emptyProgress;
  await writeDatabase(database);

  return {
    session,
    student: toSafeUser(user),
    progress: normalizeProgress(database.progress[user.id]),
  };
}

export async function destroySession(sessionId: string | null) {
  if (!sessionId) return;

  const database = await readDatabase();
  delete database.sessions[sessionId];
  await writeDatabase(database);
}

export async function recordProgressAttempt(input: AttemptInput) {
  const sessionResult = await getStudentSession(input.sessionId);
  if (!sessionResult) return null;

  const database = await readDatabase();
  const userId = sessionResult.student.id;
  database.progress[userId] ??= emptyProgress;

  const current = normalizeProgress(database.progress[userId]);
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

  const nextProgress: ProgressState = {
    ...current,
    completed,
    attempts: [attempt, ...current.attempts].slice(0, 100),
  };

  database.progress[userId] = nextProgress;
  await writeDatabase(database);

  return nextProgress;
}

export async function recordQuizResult(input: QuizInput) {
  const sessionResult = await getStudentSession(input.sessionId);
  if (!sessionResult) return null;

  const database = await readDatabase();
  const userId = sessionResult.student.id;
  const current = normalizeProgress(database.progress[userId]);
  const result: QuizResultRecord = {
    id: `quiz-${Date.now()}-${randomUUID().slice(0, 8)}`,
    lessonSlug: input.lessonSlug,
    score: clampNumber(input.score, 0, input.total),
    total: Math.max(1, input.total),
    answers: input.answers.slice(0, 20),
    submittedAt: new Date().toISOString(),
  };

  database.progress[userId] = {
    ...current,
    quizResults: [
      result,
      ...current.quizResults.filter((item) => item.lessonSlug !== input.lessonSlug),
    ].slice(0, 200),
  };
  await writeDatabase(database);
  return database.progress[userId];
}

export async function recordHintView(input: HintInput) {
  const sessionResult = await getStudentSession(input.sessionId);
  if (!sessionResult) return null;

  const database = await readDatabase();
  const userId = sessionResult.student.id;
  const current = normalizeProgress(database.progress[userId]);
  const hint: HintUsageRecord = {
    id: `hint-${Date.now()}-${randomUUID().slice(0, 8)}`,
    challengeId: input.challengeId,
    hintIndex: clampNumber(input.hintIndex, 1, 20),
    viewedAt: new Date().toISOString(),
  };

  database.progress[userId] = {
    ...current,
    hintViews: [hint, ...current.hintViews].slice(0, 300),
  };
  await writeDatabase(database);
  return database.progress[userId];
}

export async function saveEvidenceNotebook(input: EvidenceInput) {
  const sessionResult = await getStudentSession(input.sessionId);
  if (!sessionResult) return null;

  const database = await readDatabase();
  const userId = sessionResult.student.id;
  const current = normalizeProgress(database.progress[userId]);
  const existing = current.evidenceNotebooks.find(
    (item) => item.challengeId === input.challengeId,
  );
  const note: EvidenceNotebookRecord = {
    id: existing?.id ?? `evidence-${Date.now()}-${randomUUID().slice(0, 8)}`,
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
    ].slice(0, 200),
  };
  await writeDatabase(database);
  return database.progress[userId];
}

export async function recordGeneratedReport(input: ReportInput) {
  const sessionResult = await getStudentSession(input.sessionId);
  if (!sessionResult) return null;

  const database = await readDatabase();
  const userId = sessionResult.student.id;
  const current = normalizeProgress(database.progress[userId]);
  const report: GeneratedReportRecord = {
    id: `report-${Date.now()}-${randomUUID().slice(0, 8)}`,
    challengeId: input.challengeId,
    format: input.format,
    title: input.title.slice(0, 140),
    generatedAt: new Date().toISOString(),
  };

  database.progress[userId] = {
    ...current,
    reports: [report, ...current.reports].slice(0, 200),
  };
  await writeDatabase(database);
  return database.progress[userId];
}

export async function getInstructorAnalytics() {
  const database = await readDatabase();
  const users = Object.values(database.users).map(toSafeUser);
  const progressByUser = Object.entries(database.progress).map(([userId, progress]) => ({
    userId,
    progress: normalizeProgress(progress),
  }));
  const activeCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const students = users.filter((user) => user.role === "student");
  const activeStudents = students.filter(
    (user) => new Date(user.lastSeenAt).getTime() >= activeCutoff,
  );
  const totalLabSlots = Math.max(1, students.length * challenges.length);
  const solvedCount = progressByUser.reduce(
    (sum, item) => sum + item.progress.completed.length,
    0,
  );
  const attempts = progressByUser.flatMap((item) =>
    item.progress.attempts.map((attempt) => ({ ...attempt, userId: item.userId })),
  );
  const quizResults = progressByUser.flatMap((item) =>
    item.progress.quizResults.map((quiz) => ({ ...quiz, userId: item.userId })),
  );
  const hintViews = progressByUser.flatMap((item) =>
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
    const progress = normalizeProgress(database.progress[student.id]);
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
    labCompletionPercentage: Math.round((solvedCount / totalLabSlots) * 100),
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
  };
}

export function getDatabaseAdapterStatus(): DatabaseAdapterStatus {
  return {
    provider: (process.env.VULNMENTOR_DATABASE_PROVIDER as DatabaseProvider | undefined) ?? "json",
    activeProvider: "json",
    readyForMigration: true,
    models: [
      "users",
      "sessions",
      "labs",
      "lessons",
      "progress",
      "attempts",
      "quiz_results",
      "evidence_notebooks",
      "notes",
      "instructor_reports",
    ],
  };
}

async function createSessionForUser(database: ProgressDatabase, userId: string) {
  const user = database.users[userId];
  const now = new Date();
  const session: SessionRecord = {
    id: randomUUID(),
    userId,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + sessionLifetimeMs).toISOString(),
  };

  user.lastSeenAt = now.toISOString();
  database.sessions[session.id] = session;
  database.users[user.id] = user;
  database.progress[user.id] ??= emptyProgress;
  await writeDatabase(database);

  return {
    session,
    student: toSafeUser(user),
    progress: normalizeProgress(database.progress[user.id]),
  };
}

async function readDatabase(): Promise<ProgressDatabase> {
  try {
    const raw = await readFile(databasePath, "utf8");
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
  } catch {
    return { users: {}, sessions: {}, progress: {} };
  }
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
  const temporaryPath = `${databasePath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(database, null, 2));
  await rename(temporaryPath, databasePath);
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function resolveRegistrationRole(database: ProgressDatabase, input: RegisterInput): UserRole {
  const existingUserCount = Object.keys(database.users).length;
  if (input.role !== "instructor") return "student";
  if (existingUserCount === 0) return "instructor";

  const configuredCode = process.env.VULNMENTOR_INSTRUCTOR_CODE;
  const localDevInstructor =
    process.env.NODE_ENV !== "production" && normalizeEmail(input.email).endsWith(".test");

  if (!localDevInstructor && (!configuredCode || input.instructorCode !== configuredCode)) {
    throw new Error("Instructor registration requires a valid instructor code.");
  }

  return "instructor";
}

function findUserByEmail(database: ProgressDatabase, email: string) {
  return Object.values(database.users).find((user) => user.email === email) ?? null;
}

function toSafeUser(user: UserRecord): StudentSession {
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

function normalizeName(name: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return "Student";
  return clean.slice(0, 80);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase().slice(0, 160);
}

function normalizeUsn(usn?: string) {
  return (usn ?? "").trim().toUpperCase().slice(0, 32);
}

function cleanLongText(value: string) {
  return value.trim().slice(0, 4000);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
