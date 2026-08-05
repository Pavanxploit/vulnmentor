#!/usr/bin/env node
/**
 * Security regression suite for VulnMentor.
 *
 * Exercises the hardening that is easy to undo by accident: concurrent write
 * safety, CSV formula injection, Markdown evidence containment, cross-origin
 * rejection, and auth rate limiting.
 *
 * Requires the portal to be running locally:
 *   npm run dev
 *   npm run security-check
 *
 * Test accounts are removed from .data/vulnmentor-progress.json on completion.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE = process.env.VULNMENTOR_BASE_URL ?? "http://localhost:3000";
const PORTAL_ORIGIN = BASE;
const LAB_ORIGIN = "http://127.0.0.1:4060";
const DATABASE_PATH = path.join(process.cwd(), ".data", "vulnmentor-progress.json");
const SQLITE_PATH = path.join(process.cwd(), ".data", "vulnmentor.sqlite");
const ACCOUNT_PREFIX = "security-regression-";

const results = [];

function check(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? "ok  " : "FAIL"} - ${name}${detail ? ` (${detail})` : ""}`);
}

function portalHeaders(cookie) {
  const headers = { "content-type": "application/json", origin: PORTAL_ORIGIN };
  if (cookie) headers.cookie = cookie;
  return headers;
}

async function main() {
  const email = `${ACCOUNT_PREFIX}${Date.now()}@example.com`;

  const registerResponse = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: portalHeaders(),
    body: JSON.stringify({ name: "Security Regression", email, password: "regression-probe-123" }),
  });

  const registerBody = await registerResponse.json();
  if (!registerBody.ok) {
    throw new Error(`could not create probe account: ${registerBody.message ?? registerResponse.status}`);
  }

  const cookie = registerResponse.headers
    .getSetCookie()
    .find((value) => value.startsWith("vulnmentor_session="))
    .split(";")[0];

  check("session token is 256-bit", cookie.split("=")[1].length === 64, `${cookie.split("=")[1].length} hex chars`);

  await checkConcurrentWrites(cookie);
  await checkCsvInjection(cookie);
  await checkMarkdownContainment(cookie);
  await checkCrossOriginRejection(cookie);
  await checkRateLimit(email);

  await removeProbeAccounts();

  const failed = results.filter((result) => !result.passed);
  console.log("");
  if (failed.length > 0) {
    console.log(`Security regression FAILED: ${failed.length} of ${results.length} checks.`);
    process.exit(1);
  }
  console.log(`Security regression passed: ${results.length} checks.`);
}

/** Concurrent submissions must all persist: no lost updates, no rename crash. */
async function checkConcurrentWrites(cookie) {
  const total = 20;
  const submissions = Array.from({ length: total }, (_, index) =>
    fetch(`${BASE}/api/flags/verify`, {
      method: "POST",
      headers: portalHeaders(cookie),
      body: JSON.stringify({ challengeId: "web-sqli-login", flag: `wrong-${index}` }),
    }),
  );

  const responses = await Promise.all(submissions);
  const serverErrors = responses.filter((response) => response.status >= 500).length;
  const sessionResponse = await fetch(`${BASE}/api/auth/session`, { headers: { cookie } });
  const stored = (await sessionResponse.json()).progress?.attempts?.length ?? 0;

  check("concurrent writes do not crash", serverErrors === 0, `${serverErrors} server errors`);
  check("concurrent writes lose no attempts", stored === total, `${stored}/${total} persisted`);
}

/** Student-authored text must not execute when an instructor opens the export. */
async function checkCsvInjection(cookie) {
  await saveEvidence(cookie, { impactSummary: "=cmd|'/c calc.exe'!A1" });
  const content = await generateReport(cookie, "csv");
  const impactLine = content.split("\n").find((line) => line.startsWith('"impact"'));

  check("CSV formula injection neutralised", impactLine.includes(`"'=`), impactLine?.slice(0, 40));
}

/** Pasted markup must stay inert when the report is rendered to HTML or PDF. */
async function checkMarkdownContainment(cookie) {
  await saveEvidence(cookie, {
    normalRequest: "<script>alert(1)</script>",
    impactSummary: "<img src=x onerror=alert(1)>",
  });
  const content = await generateReport(cookie, "markdown");

  check("markdown prose escapes raw HTML", content.includes("&lt;img src=x") && !content.includes("<img src=x"));
  check("markdown evidence stays inside a code block", content.includes("    <script>alert(1)</script>"));
}

/**
 * The labs share SameSite's notion of "site" with the portal because they only
 * differ by port, so the Origin check is what actually blocks a lab payload
 * from driving the portal API.
 */
async function checkCrossOriginRejection(cookie) {
  const blocked = await fetch(`${BASE}/api/flags/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: LAB_ORIGIN,
      "sec-fetch-site": "same-site",
      cookie,
    },
    body: JSON.stringify({ challengeId: "web-sqli-login", flag: "guess" }),
  });

  const allowed = await fetch(`${BASE}/api/flags/verify`, {
    method: "POST",
    headers: { ...portalHeaders(cookie), "sec-fetch-site": "same-origin" },
    body: JSON.stringify({ challengeId: "web-sqli-login", flag: "guess" }),
  });

  check("cross-origin request from lab port is rejected", blocked.status === 403, `status ${blocked.status}`);
  check("same-origin request still succeeds", allowed.status === 200, `status ${allowed.status}`);
}

async function checkRateLimit(email) {
  let limited = false;
  let attempts = 0;

  for (let index = 0; index < 15; index += 1) {
    const response = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: portalHeaders(),
      body: JSON.stringify({ email, password: "definitely-wrong" }),
    });

    if (response.status === 429) {
      limited = true;
      check("rate limited response carries Retry-After", Boolean(response.headers.get("retry-after")));
      break;
    }
    attempts += 1;
  }

  check("login brute force is rate limited", limited, `blocked after ${attempts} attempts`);

  const other = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: portalHeaders(),
    body: JSON.stringify({ email: "unrelated@example.com", password: "wrong" }),
  });

  check("rate limit is per-account, not global", other.status === 401, `status ${other.status}`);
}

async function saveEvidence(cookie, overrides) {
  const body = {
    challengeId: "web-sqli-login",
    normalRequest: "GET /login",
    modifiedRequest: "POST /login",
    vulnerableResponse: "200 OK",
    secureResponse: "401 Unauthorized",
    traceProof: "local trace",
    impactSummary: "impact",
    rootCause: "root cause",
    fixRecommendation: "fix",
    ...overrides,
  };

  await fetch(`${BASE}/api/evidence`, {
    method: "POST",
    headers: portalHeaders(cookie),
    body: JSON.stringify(body),
  });
}

async function generateReport(cookie, format) {
  const response = await fetch(`${BASE}/api/reports`, {
    method: "POST",
    headers: portalHeaders(cookie),
    body: JSON.stringify({ challengeId: "web-sqli-login", format }),
  });
  return (await response.json()).content;
}

async function removeProbeAccounts() {
  await removeProbeAccountsFromSqlite();
  await removeProbeAccountsFromJson();
}

/** Cascading foreign keys clear the probe's progress rows along with the user. */
async function removeProbeAccountsFromSqlite() {
  if (!existsSync(SQLITE_PATH)) return;

  try {
    const { default: Database } = await import("better-sqlite3");
    const db = new Database(SQLITE_PATH);
    db.pragma("foreign_keys = ON");
    const removed = db
      .prepare("DELETE FROM users WHERE email LIKE ?")
      .run(`${ACCOUNT_PREFIX}%`).changes;
    db.close();
    console.log(`\ncleaned up ${removed} probe account(s) from SQLite`);
  } catch (error) {
    console.warn("could not clean up SQLite probe accounts:", error.message);
  }
}

async function removeProbeAccountsFromJson() {
  if (!existsSync(DATABASE_PATH)) return;

  try {
    const database = JSON.parse(await readFile(DATABASE_PATH, "utf8"));
    const doomed = Object.values(database.users)
      .filter((user) => user.email.startsWith(ACCOUNT_PREFIX))
      .map((user) => user.id);

    for (const id of doomed) {
      delete database.users[id];
      delete database.progress[id];
    }
    for (const [sessionId, session] of Object.entries(database.sessions)) {
      if (doomed.includes(session.userId)) delete database.sessions[sessionId];
    }

    await writeFile(DATABASE_PATH, JSON.stringify(database, null, 2));
    console.log(`\ncleaned up ${doomed.length} probe account(s)`);
  } catch (error) {
    console.warn("could not clean up probe accounts:", error.message);
  }
}

main().catch((error) => {
  console.error(`\nSecurity regression could not run: ${error.message}`);
  console.error("Is the portal running? Start it with: npm run dev");
  process.exit(1);
});
