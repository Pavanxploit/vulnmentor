-- VulnMentor SQLite schema.
--
-- Read by both the runtime adapter (src/lib/store/sqlite-store.ts) and the
-- migration script (scripts/migrate-to-sqlite.mjs) so the two cannot drift.
-- Every statement is idempotent, so opening an existing database is a no-op.
--
-- Progress used to live in one JSON blob per user. It is normalised here so the
-- instructor analytics queries can be indexed instead of scanning every record.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  usn           TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at   TEXT NOT NULL
);

-- Row order (rowid) preserves the order labs were solved in, matching the
-- append-only `completed` array the JSON store kept.
CREATE TABLE IF NOT EXISTS completed_labs (
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  correct      INTEGER NOT NULL CHECK (correct IN (0, 1)),
  flag_preview TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);

-- One row per lesson per student: a retake replaces the previous score, which
-- is what the JSON store did by filtering the old entry out.
CREATE TABLE IF NOT EXISTS quiz_results (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_slug  TEXT NOT NULL,
  score        INTEGER NOT NULL,
  total        INTEGER NOT NULL,
  answers      TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  UNIQUE (user_id, lesson_slug)
);

CREATE TABLE IF NOT EXISTS hint_views (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  hint_index   INTEGER NOT NULL,
  viewed_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_notebooks (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  challenge_id        TEXT NOT NULL,
  normal_request      TEXT NOT NULL DEFAULT '',
  modified_request    TEXT NOT NULL DEFAULT '',
  vulnerable_response TEXT NOT NULL DEFAULT '',
  secure_response     TEXT NOT NULL DEFAULT '',
  trace_proof         TEXT NOT NULL DEFAULT '',
  impact_summary      TEXT NOT NULL DEFAULT '',
  root_cause          TEXT NOT NULL DEFAULT '',
  fix_recommendation  TEXT NOT NULL DEFAULT '',
  updated_at          TEXT NOT NULL,
  UNIQUE (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  format       TEXT NOT NULL CHECK (format IN ('markdown', 'json', 'csv')),
  title        TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

-- Classes group students for a cohort or practice group. Join codes are stored
-- uppercase and matched uppercase, which is what makes them case-insensitive
-- for a student typing a code off a whiteboard.
CREATE TABLE IF NOT EXISTS classes (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  join_code     TEXT NOT NULL UNIQUE,
  instructor_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at    TEXT NOT NULL
);

-- Enrolment is a pure join table: removing a student from a class deletes one
-- row here and cannot touch their account or any progress table.
-- The composite primary key is what prevents joining the same class twice.
CREATE TABLE IF NOT EXISTS class_enrollments (
  class_id  TEXT NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (class_id, user_id)
);

CREATE TABLE IF NOT EXISTS schema_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes follow the queries the app actually runs.

-- Session lookup is by primary key, but cascade deletes and expiry pruning
-- scan by user and by expiry.
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- Loading a student's progress reads each table by user, newest first.
CREATE INDEX IF NOT EXISTS idx_attempts_user_time ON attempts (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_hint_views_user ON hint_views (user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON evidence_notebooks (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports (user_id, generated_at DESC);

-- Instructor analytics aggregate the other way: per challenge across students.
CREATE INDEX IF NOT EXISTS idx_attempts_challenge ON attempts (challenge_id, correct);
CREATE INDEX IF NOT EXISTS idx_hint_views_challenge ON hint_views (challenge_id);

-- Analytics filter the roster down to students before aggregating.
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- The Guide Console lists an instructor's active classes; join_code already has
-- a unique index from its constraint.
CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes (instructor_id, status);

-- "My Classes" looks up enrolments by student. The composite primary key
-- already covers lookups that start from a class.
CREATE INDEX IF NOT EXISTS idx_class_enrollments_user ON class_enrollments (user_id);
