import { randomInt, randomUUID } from "node:crypto";
import { challenges } from "@/data/challenges";
import { relationalStatement } from "./relational";

/**
 * Class and batch management.
 *
 * SQLite and PostgreSQL. The JSON store remains a demo fallback, and duplicating
 * relational joins into a flat file would cost more than it is worth for a
 * feature aimed at real classroom use. Callers check `classesAvailable()` and
 * surface a clear message rather than failing obscurely.
 */

export type ClassStatus = "active" | "archived";

export type ClassSummary = {
  id: string;
  name: string;
  description: string;
  joinCode: string;
  status: ClassStatus;
  createdAt: string;
  studentCount: number;
  completedLabs: number;
  averageCompletion: number;
  activeThisWeek: number;
};

export type ClassStudentRow = {
  id: string;
  name: string;
  email: string;
  usn: string;
  joinedAt: string;
  lastSeenAt: string;
  completedLabs: number;
  attempts: number;
  accuracy: number;
};

export type ClassDetail = ClassSummary & {
  students: ClassStudentRow[];
};

export type StudentClassRow = {
  id: string;
  name: string;
  description: string;
  status: ClassStatus;
  joinedAt: string;
  instructorName: string;
};

/**
 * Ambiguous characters are left out so a code read aloud or copied off a
 * whiteboard cannot be mistyped as a different valid code.
 */
const joinCodeAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const joinCodeLength = 7;
const maxJoinCodeAttempts = 12;

export function classesAvailable() {
  return (process.env.VULNMENTOR_DATABASE_PROVIDER ?? "sqlite") !== "json";
}

export async function createClass(input: { instructorId: string; name: string; description?: string }) {
  const name = input.name.trim().slice(0, 120);
  if (!name) throw new Error("Class name is required.");

  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    name,
    description: (input.description ?? "").trim().slice(0, 400),
    joinCode: await generateUniqueJoinCode(),
    status: "active" as const,
    createdAt: now,
  };

  await relationalStatement(
    `INSERT INTO classes (id, name, description, join_code, instructor_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.name,
    record.description,
    record.joinCode,
    input.instructorId,
    record.status,
    record.createdAt,
  );

  return record;
}

export async function listClassesForInstructor(instructorId: string, status: ClassStatus) {

  // One aggregate rather than a query per class: a class overview should not
  // scale its cost with the number of classes an instructor runs.
  const rows = await relationalStatement(
      `SELECT
         c.id, c.name, c.description, c.join_code, c.status, c.created_at,
         COUNT(DISTINCT e.user_id) AS student_count,
         COUNT(DISTINCT cl.user_id || '|' || cl.challenge_id) AS completed_labs,
         COUNT(DISTINCT CASE WHEN u.last_seen_at >= ? THEN u.id END) AS active_this_week
       FROM classes c
       LEFT JOIN class_enrollments e ON e.class_id = c.id
       LEFT JOIN users u ON u.id = e.user_id
       LEFT JOIN completed_labs cl ON cl.user_id = e.user_id
       WHERE c.instructor_id = ? AND c.status = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
    )
    .all(weekAgoIso(), instructorId, status) as ClassAggregateRow[];

  return rows.map(toClassSummary);
}

export async function getClassDetail(instructorId: string, classId: string): Promise<ClassDetail | null> {

  const summary = await relationalStatement(
      `SELECT
         c.id, c.name, c.description, c.join_code, c.status, c.created_at,
         COUNT(DISTINCT e.user_id) AS student_count,
         COUNT(DISTINCT cl.user_id || '|' || cl.challenge_id) AS completed_labs,
         COUNT(DISTINCT CASE WHEN u.last_seen_at >= ? THEN u.id END) AS active_this_week
       FROM classes c
       LEFT JOIN class_enrollments e ON e.class_id = c.id
       LEFT JOIN users u ON u.id = e.user_id
       LEFT JOIN completed_labs cl ON cl.user_id = e.user_id
       WHERE c.id = ? AND c.instructor_id = ?
       GROUP BY c.id`,
    )
    .get(weekAgoIso(), classId, instructorId) as ClassAggregateRow | undefined;

  if (!summary) return null;

  const students = await relationalStatement(
      `SELECT
         u.id, u.name, u.email, u.usn, u.last_seen_at, e.joined_at,
         (SELECT COUNT(*) FROM completed_labs cl WHERE cl.user_id = u.id) AS completed_labs,
         (SELECT COUNT(*) FROM attempts a WHERE a.user_id = u.id) AS attempts,
         (SELECT COUNT(*) FROM attempts a WHERE a.user_id = u.id AND a.correct = 1) AS correct_attempts
       FROM class_enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.class_id = ?
       ORDER BY lower(u.name)`,
    )
    .all(classId) as ClassStudentAggregateRow[];

  return {
    ...toClassSummary(summary),
    students: students.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      usn: row.usn,
      joinedAt: row.joined_at,
      lastSeenAt: row.last_seen_at,
      completedLabs: row.completed_labs,
      attempts: row.attempts,
      accuracy: row.attempts ? Math.round((row.correct_attempts / row.attempts) * 100) : 0,
    })),
  };
}

export async function listClassesForStudent(userId: string): Promise<StudentClassRow[]> {

  const rows = await relationalStatement(
      `SELECT c.id, c.name, c.description, c.status, e.joined_at, i.name AS instructor_name
       FROM class_enrollments e
       JOIN classes c ON c.id = e.class_id
       JOIN users i ON i.id = c.instructor_id
       WHERE e.user_id = ?
       ORDER BY c.status ASC, e.joined_at DESC`,
    )
    .all(userId) as Array<{
    id: string;
    name: string;
    description: string;
    status: ClassStatus;
    joined_at: string;
    instructor_name: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    joinedAt: row.joined_at,
    instructorName: row.instructor_name,
  }));
}

export type JoinResult =
  | { ok: true; className: string }
  | { ok: false; reason: "not-found" | "archived" | "already-enrolled"; message: string };

export async function joinClassByCode(userId: string, rawCode: string): Promise<JoinResult> {
  const code = normalizeJoinCode(rawCode);

  const found = await relationalStatement("SELECT id, name, status FROM classes WHERE join_code = ?")
    .get(code) as { id: string; name: string; status: ClassStatus } | undefined;

  if (!found) {
    return {
      ok: false,
      reason: "not-found",
      message: "That join code does not match any class. Check it with your instructor.",
    };
  }

  if (found.status === "archived") {
    return {
      ok: false,
      reason: "archived",
      message: `"${found.name}" has been archived and is no longer accepting students.`,
    };
  }

  const inserted = await relationalStatement(
    "INSERT INTO class_enrollments (class_id,user_id,joined_at) SELECT id,?,? FROM classes WHERE id=? AND status='active' AND join_code=? ON CONFLICT(class_id,user_id) DO NOTHING"
  ).run(userId,new Date().toISOString(),found.id,code);
  if (!inserted.changes) {
    const existing = await relationalStatement("SELECT 1 FROM class_enrollments WHERE class_id=? AND user_id=?").get(found.id,userId);
    return existing ? {ok:false,reason:"already-enrolled",message:"You are already enrolled in this class."}
      : {ok:false,reason:"not-found",message:"This join code is no longer active."};
  }

  return { ok: true, className: found.name };
}

/**
 * Every instructor mutation is scoped by instructor_id in the WHERE clause, so
 * one instructor cannot act on another's class even with a valid class id.
 */
export async function setClassStatus(instructorId: string, classId: string, status: ClassStatus) {
  const { changes } = await relationalStatement("UPDATE classes SET status = ? WHERE id = ? AND instructor_id = ?")
    .run(status, classId, instructorId);

  return changes > 0;
}

export async function regenerateJoinCode(instructorId: string, classId: string) {
  const joinCode = await generateUniqueJoinCode();
  const { changes } = await relationalStatement("UPDATE classes SET join_code = ? WHERE id = ? AND instructor_id = ?")
    .run(joinCode, classId, instructorId);

  return changes > 0 ? joinCode : null;
}

/** Deletes the enrolment row only. The account and all progress rows survive. */
export async function removeStudentFromClass(instructorId: string, classId: string, studentId: string) {
  const { changes } = await relationalStatement(
      `DELETE FROM class_enrollments
       WHERE class_id = ? AND user_id = ?
         AND class_id IN (SELECT id FROM classes WHERE instructor_id = ?)`,
    )
    .run(classId, studentId, instructorId);

  return changes > 0;
}

export function normalizeJoinCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "").slice(0, 12);
}

async function generateUniqueJoinCode() {
  const exists = relationalStatement("SELECT 1 AS present FROM classes WHERE join_code = ?");

  for (let attempt = 0; attempt < maxJoinCodeAttempts; attempt += 1) {
    let code = "";
    for (let index = 0; index < joinCodeLength; index += 1) {
      code += joinCodeAlphabet[randomInt(joinCodeAlphabet.length)];
    }
    if (!await exists.get(code)) return code;
  }

  // The unique index is the real guarantee; this only means the random space
  // looks unexpectedly crowded, which is worth surfacing rather than looping.
  throw new Error("Could not generate a unique join code. Try again.");
}

function weekAgoIso() {
  return new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
}

type ClassAggregateRow = {
  id: string;
  name: string;
  description: string;
  join_code: string;
  status: ClassStatus;
  created_at: string;
  student_count: number;
  completed_labs: number;
  active_this_week: number;
};

type ClassStudentAggregateRow = {
  id: string;
  name: string;
  email: string;
  usn: string;
  last_seen_at: string;
  joined_at: string;
  completed_labs: number;
  attempts: number;
  correct_attempts: number;
};

function toClassSummary(row: ClassAggregateRow): ClassSummary {
  const possible = row.student_count * challenges.length;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    joinCode: row.join_code,
    status: row.status,
    createdAt: row.created_at,
    studentCount: row.student_count,
    completedLabs: row.completed_labs,
    averageCompletion: possible ? Math.min(100, Math.round((row.completed_labs / possible) * 100)) : 0,
    activeThisWeek: row.active_this_week,
  };
}
