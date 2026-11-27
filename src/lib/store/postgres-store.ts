import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { challenges } from "@/data/challenges";
import { postgresPool } from "./relational";
import {
  buildInstructorAnalytics,
  buildSession,
  cleanLongText,
  clampNumber,
  dummyPasswordHash,
  hashPassword,
  newRecordId,
  normalizeEmail,
  normalizeName,
  normalizeUsn,
  recordLimits,
  resolveRegistrationRole,
  sessionIdleTimeoutMs,
  sessionTouchIntervalMs,
  toSafeUser,
  validateRegistrationInput,
  verifyPassword,
  type ProgressStoreAdapter,
} from "./store-shared";
import {
  toAttemptRecord,
  toEvidenceRecord,
  toHintRecord,
  toQuizRecord,
  toReportRecord,
  toStudentSession,
  toUserRecord,
  type UserRow,
} from "./row-mapping";

async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await postgresPool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function progress(client: PoolClient, userId: string) {
  const history = async (table: string, date: string, limit: number) =>
    (
      await client.query(
        `SELECT * FROM ${table} WHERE user_id=$1 ORDER BY ${date} DESC,rowid DESC LIMIT $2`,
        [userId, limit],
      )
    ).rows;
  return {
    completed: (
      await client.query(
        "SELECT challenge_id FROM completed_labs WHERE user_id=$1 ORDER BY rowid",
        [userId],
      )
    ).rows.map((r) => String(r.challenge_id)),
    attempts: (
      await history("attempts", "submitted_at", recordLimits.attempts)
    ).map(toAttemptRecord),
    quizResults: (
      await history("quiz_results", "submitted_at", recordLimits.quizResults)
    ).map(toQuizRecord),
    hintViews: (
      await history("hint_views", "viewed_at", recordLimits.hintViews)
    ).map(toHintRecord),
    evidenceNotebooks: (
      await history(
        "evidence_notebooks",
        "updated_at",
        recordLimits.evidenceNotebooks,
      )
    ).map(toEvidenceRecord),
    reports: (
      await history("reports", "generated_at", recordLimits.reports)
    ).map(toReportRecord),
  };
}
async function newSession(client: PoolClient, user: UserRow) {
  const session = buildSession(user.id);
  await client.query(
    "INSERT INTO sessions(id,user_id,created_at,last_seen_at,expires_at) VALUES($1,$2,$3,$4,$5)",
    [
      session.id,
      user.id,
      session.createdAt,
      session.lastSeenAt,
      session.expiresAt,
    ],
  );
  await client.query("UPDATE users SET last_seen_at=$1 WHERE id=$2", [
    session.createdAt,
    user.id,
  ]);
  await client.query(
    "DELETE FROM sessions WHERE expires_at < $1 OR last_seen_at < $2",
    [
      session.createdAt,
      new Date(Date.now() - sessionIdleTimeoutMs).toISOString(),
    ],
  );
  return {
    session,
    student: toStudentSession({ ...user, last_seen_at: session.createdAt }),
    progress: await progress(client, user.id),
  };
}

async function activeSession(client: PoolClient, id: string) {
  return (
    await client.query(
      "SELECT * FROM sessions WHERE id=$1 AND expires_at >= $2 AND last_seen_at >= $3 FOR UPDATE",
      [
        id,
        new Date().toISOString(),
        new Date(Date.now() - sessionIdleTimeoutMs).toISOString(),
      ],
    )
  ).rows[0];
}

async function updateProgress(
  id: string,
  work: (client: PoolClient, user: string, at: string) => Promise<void>,
) {
  return transaction(async (client) => {
    const session = await activeSession(client, id);
    if (!session) return null;
    await work(client, session.user_id, new Date().toISOString());
    return progress(client, session.user_id);
  });
}
export const postgresStore: ProgressStoreAdapter = {
  async registerAccount(input) {
    const { email, password } = validateRegistrationInput(input);
    const hash = await hashPassword(password);
    return transaction(async (client) => {
      // Serialize first-instructor bootstrap and duplicate-email checks.
      await client.query("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
      if (
        (await client.query("SELECT 1 FROM users WHERE email=$1", [email]))
          .rowCount
      )
        throw new Error("An account with this email already exists.");
      const count = (await client.query("SELECT COUNT(*) AS n FROM users"))
        .rows[0].n;
      const at = new Date().toISOString();
      const user = (
        await client.query(
          "INSERT INTO users(id,name,email,usn,role,password_hash,created_at,last_seen_at) VALUES($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *",
          [
            randomUUID(),
            normalizeName(input.name),
            email,
            normalizeUsn(input.usn),
            resolveRegistrationRole(input, email, Number(count)),
            hash,
            at,
          ],
        )
      ).rows[0];
      return newSession(client, user);
    });
  },
  async loginAccount(input) {
    const user = (
      await postgresPool().query("SELECT * FROM users WHERE email=$1", [
        normalizeEmail(input.email),
      ])
    ).rows[0];
    const valid = await verifyPassword(
      input.password,
      user?.password_hash ?? dummyPasswordHash,
    );
    if (!valid || !user) throw new Error("Invalid email or password.");
    return transaction((client) => newSession(client, user));
  },
  async getStudentSession(id) {
    if (!id) return null;
    return transaction(async (client) => {
      const row = await activeSession(client, id);
      if (!row) return null;
      const user = (
        await client.query("SELECT * FROM users WHERE id=$1", [row.user_id])
      ).rows[0];
      if (Date.now() - Date.parse(row.last_seen_at) > sessionTouchIntervalMs) {
        row.last_seen_at = user.last_seen_at = new Date().toISOString();
        await client.query("UPDATE sessions SET last_seen_at=$1 WHERE id=$2", [
          row.last_seen_at,
          id,
        ]);
        await client.query("UPDATE users SET last_seen_at=$1 WHERE id=$2", [
          row.last_seen_at,
          user.id,
        ]);
      }
      return {
        session: {
          id,
          userId: user.id,
          createdAt: row.created_at,
          lastSeenAt: row.last_seen_at,
          expiresAt: row.expires_at,
        },
        student: toSafeUser(toUserRecord(user)),
        progress: await progress(client, user.id),
      };
    });
  },
  async destroySession(id) {
    if (id)
      await postgresPool().query("DELETE FROM sessions WHERE id=$1", [id]);
  },
  recordProgressAttempt(input) {
    return updateProgress(input.sessionId, async (c, u, at) => {
      await c.query(
        "INSERT INTO attempts(id,user_id,challenge_id,correct,flag_preview,submitted_at) VALUES($1,$2,$3,$4,$5,$6)",
        [
          newRecordId("attempt"),
          u,
          input.challengeId,
          Number(input.correct),
          input.flagPreview,
          at,
        ],
      );
      if (input.correct)
        await c.query(
          "INSERT INTO completed_labs(user_id,challenge_id,completed_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
          [u, input.challengeId, at],
        );
    });
  },
  recordQuizResult(input) {
    return updateProgress(input.sessionId, async (c, u, at) => {
      const total = Math.max(1, input.total);
      await c.query(
        "INSERT INTO quiz_results(id,user_id,lesson_slug,score,total,answers,submitted_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id,lesson_slug) DO UPDATE SET score=excluded.score,total=excluded.total,answers=excluded.answers,submitted_at=excluded.submitted_at",
        [
          newRecordId("quiz"),
          u,
          input.lessonSlug,
          clampNumber(input.score, 0, total),
          total,
          JSON.stringify(input.answers.slice(0, recordLimits.quizAnswers)),
          at,
        ],
      );
    });
  },
  recordHintView(input) {
    return updateProgress(input.sessionId, async (c, u, at) => {
      await c.query(
        "INSERT INTO hint_views(id,user_id,challenge_id,hint_index,viewed_at) VALUES($1,$2,$3,$4,$5)",
        [
          newRecordId("hint"),
          u,
          input.challengeId,
          clampNumber(input.hintIndex, 1, 20),
          at,
        ],
      );
    });
  },
  saveEvidenceNotebook(input) {
    return updateProgress(input.sessionId, async (c, u, at) => {
      const fields = [
        "normal_request",
        "modified_request",
        "vulnerable_response",
        "secure_response",
        "trace_proof",
        "impact_summary",
        "root_cause",
        "fix_recommendation",
      ];
      await c.query(
        `INSERT INTO evidence_notebooks(id,user_id,challenge_id,${fields.join(",")},updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(user_id,challenge_id) DO UPDATE SET ${[...fields, "updated_at"].map((f) => f + "=excluded." + f).join(",")}`,
        [
          newRecordId("evidence"),
          u,
          input.challengeId,
          ...[
            input.normalRequest,
            input.modifiedRequest,
            input.vulnerableResponse,
            input.secureResponse,
            input.traceProof,
            input.impactSummary,
            input.rootCause,
            input.fixRecommendation,
          ].map(cleanLongText),
          at,
        ],
      );
    });
  },
  recordGeneratedReport(input) {
    return updateProgress(input.sessionId, async (c, u, at) => {
      await c.query(
        "INSERT INTO reports(id,user_id,challenge_id,format,title,generated_at) VALUES($1,$2,$3,$4,$5,$6)",
        [
          newRecordId("report"),
          u,
          input.challengeId,
          input.format,
          input.title.slice(0, 140),
          at,
        ],
      );
    });
  },
  getInstructorAnalytics() {
    return transaction(async (c) => {
      const users = (await c.query("SELECT * FROM users")).rows.map(
        toStudentSession,
      );
      const byUser = new Map();
      for (const user of users)
        if (user.role === "student")
          byUser.set(user.id, await progress(c, user.id));
      return buildInstructorAnalytics(users, byUser, challenges.length);
    });
  },
};
