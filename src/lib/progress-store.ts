import { existsSync, readFileSync } from "node:fs";
import { postgresStore } from "./store/postgres-store";
import { jsonStore } from "./store/json-store";
import { sqliteDatabaseExists, sqliteStore } from "./store/sqlite-store";
import {
  jsonDatabasePath,
  sqliteDatabasePath,
  type AttemptInput,
  type DatabaseProvider,
  type EvidenceInput,
  type HintInput,
  type LoginInput,
  type ProgressStoreAdapter,
  type QuizInput,
  type RegisterInput,
  type ReportInput,
} from "./store/store-shared";

/**
 * Storage facade. The rest of the application imports only from here and never
 * learns which engine is active, so the JSON and SQLite adapters stay
 * interchangeable.
 *
 * SQLite is the default. Set VULNMENTOR_DATABASE_PROVIDER=json to fall back to
 * the flat-file store for a quick demo or to inspect data by hand.
 */

export type { DatabaseProvider };

export type DatabaseAdapterStatus = {
  provider: DatabaseProvider;
  activeProvider: DatabaseProvider;
  readyForMigration: boolean;
  models: string[];
};

let resolvedAdapter: ProgressStoreAdapter | null = null;

export async function registerAccount(input: RegisterInput) {
  return getAdapter().registerAccount(input);
}

export async function loginAccount(input: LoginInput) {
  return getAdapter().loginAccount(input);
}

export async function getStudentSession(sessionId: string | null) {
  return getAdapter().getStudentSession(sessionId);
}

export async function destroySession(sessionId: string | null) {
  return getAdapter().destroySession(sessionId);
}

export async function recordProgressAttempt(input: AttemptInput) {
  return getAdapter().recordProgressAttempt(input);
}

export async function recordQuizResult(input: QuizInput) {
  return getAdapter().recordQuizResult(input);
}

export async function recordHintView(input: HintInput) {
  return getAdapter().recordHintView(input);
}

export async function saveEvidenceNotebook(input: EvidenceInput) {
  return getAdapter().saveEvidenceNotebook(input);
}

export async function recordGeneratedReport(input: ReportInput) {
  return getAdapter().recordGeneratedReport(input);
}

export async function getInstructorAnalytics() {
  return getAdapter().getInstructorAnalytics();
}

export function getDatabaseAdapterStatus(): DatabaseAdapterStatus {
  const provider = resolveProvider();

  return {
    provider,
    activeProvider: provider,
    readyForMigration: provider === "json" && sqliteDatabaseExists(),
    models: [
      "users",
      "sessions",
      "completed_labs",
      "attempts",
      "quiz_results",
      "hint_views",
      "evidence_notebooks",
      "reports",
    ],
  };
}

function getAdapter(): ProgressStoreAdapter {
  if (resolvedAdapter) return resolvedAdapter;

  if (resolveProvider() === "postgres") return postgresStore;
  if (resolveProvider() === "json") {
    resolvedAdapter = jsonStore;
    return resolvedAdapter;
  }

  assertSqliteIsMigrated();
  resolvedAdapter = sqliteStore;
  return resolvedAdapter;
}

function resolveProvider(): DatabaseProvider {
  const configured = process.env.VULNMENTOR_DATABASE_PROVIDER;

  if (!configured || configured === "sqlite") return "sqlite";
  if (configured === "postgres") return "postgres";
  if (configured === "json") return "json";

  throw new Error(
    `VULNMENTOR_DATABASE_PROVIDER="${configured}" is not implemented. Use "sqlite", "postgres" or "json". ` +
      "See the provider setup; see docs/DATABASE_PLAN.md.",
  );
}

/**
 * Refuses to start SQLite empty while an unmigrated JSON database is sitting
 * next to it. Silently serving an empty database would look exactly like total
 * data loss to an instructor mid-class.
 */
function assertSqliteIsMigrated() {
  if (sqliteDatabaseExists()) return;
  if (!existsSync(jsonDatabasePath)) return;

  let userCount = 0;
  try {
    const parsed = JSON.parse(readFileSync(jsonDatabasePath, "utf8")) as {
      users?: Record<string, unknown>;
    };
    userCount = Object.keys(parsed.users ?? {}).length;
  } catch {
    // An unreadable JSON file is not evidence of pending data; let SQLite start.
    return;
  }

  if (userCount === 0) return;

  throw new Error(
    `Found ${userCount} account(s) in ${jsonDatabasePath} but no SQLite database at ` +
      `${sqliteDatabasePath}. Run "npm run migrate:sqlite" first, or set ` +
      `VULNMENTOR_DATABASE_PROVIDER=json to keep using the JSON store.`,
  );
}
