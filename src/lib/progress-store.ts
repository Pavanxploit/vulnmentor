import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  emptyProgress,
  type ProgressState,
  type StudentSession,
  type UserRole,
} from "./progress-types";

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
    progress: database.progress[user.id],
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

  const current = database.progress[userId];
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

  database.progress[userId] = nextProgress;
  await writeDatabase(database);

  return nextProgress;
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
    progress: database.progress[user.id],
  };
}

async function readDatabase(): Promise<ProgressDatabase> {
  try {
    const raw = await readFile(databasePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ProgressDatabase>;
    return {
      users: parsed.users ?? {},
      sessions: parsed.sessions ?? {},
      progress: parsed.progress ?? {},
    };
  } catch {
    return { users: {}, sessions: {}, progress: {} };
  }
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
