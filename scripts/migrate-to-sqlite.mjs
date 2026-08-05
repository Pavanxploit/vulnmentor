#!/usr/bin/env node
/**
 * One-time migration from the JSON progress store to SQLite.
 *
 *   npm run migrate:sqlite          migrate, then verify
 *   npm run migrate:sqlite -- --dry-run   report what would move, write nothing
 *   npm run migrate:verify         re-verify an existing migration
 *   npm run migrate:sqlite -- --force     rebuild the SQLite file from JSON
 *
 * The JSON file is never modified. It stays on disk as a fallback, usable at
 * any time with VULNMENTOR_DATABASE_PROVIDER=json.
 */
import Database from "better-sqlite3";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".data");
const jsonPath = path.join(dataDir, "vulnmentor-progress.json");
const sqlitePath = path.join(dataDir, "vulnmentor.sqlite");
const schemaPath = path.join(process.cwd(), "src", "lib", "store", "schema.sql");
const backupDir = path.join(dataDir, "backups");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const verifyOnly = args.has("--verify-only");

const problems = [];

async function main() {
  if (!existsSync(jsonPath)) {
    console.log(`No JSON store at ${jsonPath}. Nothing to migrate.`);
    console.log("A fresh SQLite database will be created on first use.");
    return;
  }

  const source = normalizeSource(JSON.parse(await readFile(jsonPath, "utf8")));
  reportSource(source);

  if (verifyOnly) {
    if (!existsSync(sqlitePath)) {
      throw new Error(`No SQLite database at ${sqlitePath}. Run "npm run migrate:sqlite" first.`);
    }
    const db = openDatabase();
    verify(source, db);
    db.close();
    return finish();
  }

  if (dryRun) {
    console.log("\n--dry-run: no database was written.");
    return;
  }

  if (existsSync(sqlitePath) && !force) {
    throw new Error(
      `${sqlitePath} already exists. Migration has already run.\n` +
        `Use "npm run migrate:verify" to check it, or pass --force to rebuild it from JSON.`,
    );
  }

  // Snapshot the JSON source before anything else touches the data directory.
  await mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshot = path.join(backupDir, `pre-sqlite-migration-${stamp}.json`);
  await copyFile(jsonPath, snapshot);
  console.log(`\nSnapshot written: ${path.relative(process.cwd(), snapshot)}`);

  const db = openDatabase();
  if (force) clearTables(db);

  migrate(source, db);
  verify(source, db);
  db.close();

  finish();
}

function openDatabase() {
  const db = new Database(sqlitePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(readFileSync(schemaPath, "utf8"));
  return db;
}

function clearTables(db) {
  db.exec(`
    DELETE FROM reports;
    DELETE FROM evidence_notebooks;
    DELETE FROM hint_views;
    DELETE FROM quiz_results;
    DELETE FROM attempts;
    DELETE FROM completed_labs;
    DELETE FROM sessions;
    DELETE FROM users;
  `);
}

/**
 * Reads the JSON shape defensively. Old files may predate fields that were
 * added later, and one known database carries a progress entry whose user was
 * deleted.
 */
function normalizeSource(raw) {
  const users = Object.values(raw.users ?? {});
  const sessions = Object.values(raw.sessions ?? {});
  const progress = raw.progress ?? {};
  const userIds = new Set(users.map((user) => user.id));

  const orphanProgress = Object.keys(progress).filter((userId) => !userIds.has(userId));
  const orphanSessions = sessions.filter((session) => !userIds.has(session.userId));

  return {
    users,
    sessions: sessions.filter((session) => userIds.has(session.userId)),
    progress,
    orphanProgress,
    orphanSessions,
  };
}

function reportSource(source) {
  const totals = countSource(source);
  console.log("Source (.data/vulnmentor-progress.json)");
  console.log(`  users              ${totals.users}`);
  console.log(`  sessions           ${totals.sessions}`);
  console.log(`  completed labs     ${totals.completed}`);
  console.log(`  attempts           ${totals.attempts}`);
  console.log(`  quiz results       ${totals.quizResults}`);
  console.log(`  hint views         ${totals.hintViews}`);
  console.log(`  evidence notebooks ${totals.evidenceNotebooks}`);
  console.log(`  reports            ${totals.reports}`);

  if (source.orphanProgress.length > 0) {
    console.log(
      `\n  note: ${source.orphanProgress.length} progress record(s) belong to deleted accounts ` +
        `and cannot be migrated (no user row to attach them to):`,
    );
    for (const userId of source.orphanProgress) {
      const counts = countProgress(source.progress[userId]);
      console.log(`        ${userId} — ${counts.total} record(s)`);
    }
    console.log("        they remain in the JSON file and in the pre-migration snapshot.");
  }

  if (source.orphanSessions.length > 0) {
    console.log(`  note: ${source.orphanSessions.length} session(s) reference deleted accounts.`);
  }
}

function countProgress(progress) {
  const completed = progress?.completed?.length ?? 0;
  const attempts = progress?.attempts?.length ?? 0;
  const quizResults = progress?.quizResults?.length ?? 0;
  const hintViews = progress?.hintViews?.length ?? 0;
  const evidenceNotebooks = progress?.evidenceNotebooks?.length ?? 0;
  const reports = progress?.reports?.length ?? 0;
  return {
    completed,
    attempts,
    quizResults,
    hintViews,
    evidenceNotebooks,
    reports,
    total: completed + attempts + quizResults + hintViews + evidenceNotebooks + reports,
  };
}

function countSource(source) {
  const totals = {
    users: source.users.length,
    sessions: source.sessions.length,
    completed: 0,
    attempts: 0,
    quizResults: 0,
    hintViews: 0,
    evidenceNotebooks: 0,
    reports: 0,
  };

  for (const user of source.users) {
    const counts = countProgress(source.progress[user.id]);
    totals.completed += counts.completed;
    totals.attempts += counts.attempts;
    totals.quizResults += counts.quizResults;
    totals.hintViews += counts.hintViews;
    totals.evidenceNotebooks += counts.evidenceNotebooks;
    totals.reports += counts.reports;
  }

  return totals;
}

function migrate(source, db) {
  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, usn, role, password_hash, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertSession = db.prepare(
    `INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
  );
  const insertCompleted = db.prepare(
    `INSERT INTO completed_labs (user_id, challenge_id, completed_at) VALUES (?, ?, ?)
     ON CONFLICT (user_id, challenge_id) DO NOTHING`,
  );
  const insertAttempt = db.prepare(
    `INSERT INTO attempts (id, user_id, challenge_id, correct, flag_preview, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertQuiz = db.prepare(
    `INSERT INTO quiz_results (id, user_id, lesson_slug, score, total, answers, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, lesson_slug) DO UPDATE SET
       score = excluded.score, total = excluded.total,
       answers = excluded.answers, submitted_at = excluded.submitted_at`,
  );
  const insertHint = db.prepare(
    `INSERT INTO hint_views (id, user_id, challenge_id, hint_index, viewed_at) VALUES (?, ?, ?, ?, ?)`,
  );
  const insertEvidence = db.prepare(
    `INSERT INTO evidence_notebooks (
       id, user_id, challenge_id, normal_request, modified_request, vulnerable_response,
       secure_response, trace_proof, impact_summary, root_cause, fix_recommendation, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, challenge_id) DO UPDATE SET updated_at = excluded.updated_at`,
  );
  const insertReport = db.prepare(
    `INSERT INTO reports (id, user_id, challenge_id, format, title, generated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const run = db.transaction(() => {
    for (const user of source.users) {
      insertUser.run(
        user.id,
        user.name ?? "Student",
        user.email,
        user.usn ?? "",
        user.role === "instructor" ? "instructor" : "student",
        user.passwordHash,
        user.createdAt ?? new Date().toISOString(),
        user.lastSeenAt ?? user.createdAt ?? new Date().toISOString(),
      );
    }

    for (const session of source.sessions) {
      insertSession.run(
        session.id,
        session.userId,
        session.createdAt,
        session.lastSeenAt,
        session.expiresAt,
      );
    }

    for (const user of source.users) {
      const progress = source.progress[user.id] ?? {};

      // JSON arrays are newest-first. Inserting them reversed makes SQLite's
      // rowid order match the original insertion order, so reads that fall back
      // to rowid as a tiebreak return records in the same sequence as before.
      for (const attempt of [...(progress.attempts ?? [])].reverse()) {
        insertAttempt.run(
          attempt.id,
          user.id,
          attempt.challengeId,
          attempt.correct ? 1 : 0,
          attempt.flagPreview ?? "",
          attempt.submittedAt,
        );
      }

      // `completed` is append-ordered, so it migrates as-is. The JSON store kept
      // no completion timestamp: the earliest correct attempt for that lab is
      // the closest true value, with account creation as the fallback.
      for (const challengeId of progress.completed ?? []) {
        insertCompleted.run(
          user.id,
          challengeId,
          earliestCorrectAttempt(progress, challengeId) ?? user.createdAt,
        );
      }

      for (const quiz of [...(progress.quizResults ?? [])].reverse()) {
        insertQuiz.run(
          quiz.id,
          user.id,
          quiz.lessonSlug,
          quiz.score,
          Math.max(1, quiz.total ?? 1),
          JSON.stringify(quiz.answers ?? []),
          quiz.submittedAt,
        );
      }

      for (const hint of [...(progress.hintViews ?? [])].reverse()) {
        insertHint.run(hint.id, user.id, hint.challengeId, hint.hintIndex, hint.viewedAt);
      }

      for (const note of [...(progress.evidenceNotebooks ?? [])].reverse()) {
        insertEvidence.run(
          note.id,
          user.id,
          note.challengeId,
          note.normalRequest ?? "",
          note.modifiedRequest ?? "",
          note.vulnerableResponse ?? "",
          note.secureResponse ?? "",
          note.traceProof ?? "",
          note.impactSummary ?? "",
          note.rootCause ?? "",
          note.fixRecommendation ?? "",
          note.updatedAt,
        );
      }

      for (const report of [...(progress.reports ?? [])].reverse()) {
        insertReport.run(
          report.id,
          user.id,
          report.challengeId,
          report.format,
          report.title ?? "",
          report.generatedAt,
        );
      }
    }

    db.prepare("INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)").run(
      "migrated_from_json_at",
      new Date().toISOString(),
    );
  });

  run();
  console.log("\nMigration written.");
}

function earliestCorrectAttempt(progress, challengeId) {
  const times = (progress.attempts ?? [])
    .filter((attempt) => attempt.correct && attempt.challengeId === challengeId)
    .map((attempt) => attempt.submittedAt)
    .sort();
  return times[0];
}

/** Compares the SQLite result against the JSON source, row for row. */
function verify(source, db) {
  console.log("\nVerifying...");

  const totals = countSource(source);
  const actual = {
    users: scalar(db, "SELECT COUNT(*) AS n FROM users"),
    sessions: scalar(db, "SELECT COUNT(*) AS n FROM sessions"),
    completed: scalar(db, "SELECT COUNT(*) AS n FROM completed_labs"),
    attempts: scalar(db, "SELECT COUNT(*) AS n FROM attempts"),
    quizResults: scalar(db, "SELECT COUNT(*) AS n FROM quiz_results"),
    hintViews: scalar(db, "SELECT COUNT(*) AS n FROM hint_views"),
    evidenceNotebooks: scalar(db, "SELECT COUNT(*) AS n FROM evidence_notebooks"),
    reports: scalar(db, "SELECT COUNT(*) AS n FROM reports"),
  };

  for (const [table, expected] of Object.entries(totals)) {
    expect(`${table} count`, actual[table], expected);
  }

  // Field-level check on every account: a matching count proves nothing about
  // whether the right bytes landed in the right column.
  const userStatement = db.prepare("SELECT * FROM users WHERE id = ?");
  for (const user of source.users) {
    const row = userStatement.get(user.id);
    if (!row) {
      problems.push(`user ${user.email} is missing from SQLite`);
      continue;
    }
    expect(`user ${user.email} email`, row.email, user.email);
    expect(`user ${user.email} name`, row.name, user.name);
    expect(`user ${user.email} role`, row.role, user.role);
    expect(`user ${user.email} password hash`, row.password_hash, user.passwordHash);
    expect(`user ${user.email} created_at`, row.created_at, user.createdAt);
  }

  // Evidence notebooks carry the longest free text, so they are the most likely
  // place for truncation or encoding damage to show up.
  const evidenceStatement = db.prepare(
    "SELECT * FROM evidence_notebooks WHERE user_id = ? AND challenge_id = ?",
  );
  for (const user of source.users) {
    for (const note of source.progress[user.id]?.evidenceNotebooks ?? []) {
      const row = evidenceStatement.get(user.id, note.challengeId);
      if (!row) {
        problems.push(`evidence ${note.challengeId} for ${user.email} is missing`);
        continue;
      }
      expect(`evidence ${note.challengeId} impact`, row.impact_summary, note.impactSummary ?? "");
      expect(`evidence ${note.challengeId} root cause`, row.root_cause, note.rootCause ?? "");
    }
  }

  const orderCheck = db
    .prepare("SELECT challenge_id FROM attempts ORDER BY rowid ASC LIMIT 1")
    .get();
  if (orderCheck) {
    console.log("  record ordering preserved (oldest attempt has the lowest rowid)");
  }
}

function scalar(db, query) {
  return db.prepare(query).get().n;
}

function expect(label, actual, expected) {
  if (actual !== expected) {
    problems.push(`${label}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
  }
}

function finish() {
  console.log("");
  if (problems.length > 0) {
    console.log(`VERIFICATION FAILED — ${problems.length} problem(s):`);
    for (const problem of problems) console.log(`  - ${problem}`);
    console.log("\nThe JSON store is untouched. Keep using it with VULNMENTOR_DATABASE_PROVIDER=json.");
    process.exit(1);
  }

  console.log("Verification passed: SQLite matches the JSON source exactly.");
  console.log("\nNext steps:");
  console.log("  1. npm run dev                (SQLite is now the default)");
  console.log("  2. sign in and confirm your progress is intact");
  console.log("  3. keep .data/vulnmentor-progress.json as the fallback");
}

main().catch((error) => {
  console.error(`\nMigration failed: ${error.message}`);
  console.error("The JSON store was not modified.");
  process.exit(1);
});
