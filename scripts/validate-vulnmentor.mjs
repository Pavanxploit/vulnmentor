import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label: `${label}: ${detail}`, ok: false });
}

function readProjectFile(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), "utf8");
}

function requireFile(relativePath) {
  if (existsSync(path.join(rootDir, relativePath))) {
    pass(`${relativePath} exists`);
    return;
  }

  fail(`${relativePath} exists`, "missing");
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function validateChallengeCatalog() {
  const source = readProjectFile("src/data/challenges.ts");
  const idMatches = [...source.matchAll(/\n\s+id:\s*"([^"]+)"/g)];
  const ids = idMatches.map((match) => match[1]);

  if (ids.length >= 6) {
    pass(`challenge catalog has ${ids.length} challenges`);
  } else {
    fail("challenge catalog count", `expected at least 6 challenges, found ${ids.length}`);
  }

  for (const [index, id] of ids.entries()) {
    const start = idMatches[index].index ?? 0;
    const end = idMatches[index + 1]?.index ?? source.indexOf("];", start);
    const block = source.slice(start, end);
    const label = `challenge ${id}`;

    if (block.includes("teaching:") && block.includes("lessonSlug:")) pass(`${label} has teaching metadata`);
    else fail(`${label} teaching metadata`, "missing teaching or lessonSlug");

    if (block.includes("quiz:") && countMatches(block, /question:\s*"/g) >= 3) pass(`${label} has quiz coverage`);
    else fail(`${label} quiz coverage`, "expected at least 3 questions");

    if (block.includes("evidenceChecklist:") && countMatches(block, /evidenceChecklist:[\s\S]*?commonMistakes:/g) >= 1) {
      pass(`${label} has evidence checklist`);
    } else {
      fail(`${label} evidence checklist`, "missing");
    }

    if (block.includes("code:") && block.includes("vulnerable:") && block.includes("secure:")) {
      pass(`${label} has vulnerable and secure code`);
    } else {
      fail(`${label} secure comparison`, "missing vulnerable or secure code");
    }

    if (
      block.includes("lab:") &&
      block.includes("healthUrl:") &&
      block.includes("tracesUrl:") &&
      block.includes("serviceName:")
    ) {
      pass(`${label} has Docker lab endpoints`);
    } else {
      fail(`${label} Docker lab endpoints`, "missing lab, health, trace, or service name");
    }

    if (countMatches(block, /title:\s*"Hint /g) >= 3) pass(`${label} has progressive hints`);
    else fail(`${label} hints`, "expected at least 3 hints");
  }
}

function validateRoutesAndSafety() {
  const guideRoute = readProjectFile("src/app/guide/page.tsx");
  if (guideRoute.includes("requireRolePage") && guideRoute.includes('"instructor"')) {
    pass("Guide Console route is instructor protected");
  } else {
    fail("Guide Console protection", "missing instructor role guard");
  }

  const flagRoute = readProjectFile("src/app/api/flags/verify/route.ts");
  if (!flagRoute.includes("VM{") && flagRoute.includes("flagHashesByChallenge")) {
    pass("flag verifier uses hashed flags without plaintext answers");
  } else {
    fail("flag verifier safety", "plaintext flag marker found or hashes missing");
  }

  const readme = readProjectFile("README.md");
  if (!readme.includes("VM{")) pass("README does not publish plaintext flags");
  else fail("README flag policy", "plaintext flag marker found");
}

function validateNewPlatformRoutes() {
  [
    "src/app/api/assessments/route.ts",
    "src/app/api/evidence/route.ts",
    "src/app/api/hints/route.ts",
    "src/app/api/instructor/analytics/route.ts",
    "src/app/api/reports/route.ts",
    "src/app/api/system/database/route.ts",
    "src/app/api/labs/health/route.ts",
    "src/app/api/labs/restart/route.ts",
    "src/app/roadmap/page.tsx",
    "src/components/academy/roadmap-page.tsx",
    "src/components/academy/lab-health-panel.tsx",
    "src/app/api/classes/route.ts",
    "src/app/api/classes/join/route.ts",
    "src/app/api/classes/[id]/route.ts",
    "src/app/api/classes/[id]/students/[studentId]/route.ts",
    "src/components/academy/class-manager-panel.tsx",
    "src/components/academy/my-classes-panel.tsx",
    "src/lib/report-generator.ts",
    "src/lib/lab-health.ts",
    "src/lib/store/classes-store.ts",
  ].forEach(requireFile);
}

function validateClassManagement() {
  const schema = readProjectFile("src/lib/store/schema.sql");

  if (schema.includes("CREATE TABLE IF NOT EXISTS classes") &&
      schema.includes("CREATE TABLE IF NOT EXISTS class_enrollments")) {
    pass("class tables are declared idempotently");
  } else {
    fail("class schema", "classes or class_enrollments table is missing");
  }

  // The composite primary key is what stops a student joining twice, and the
  // foreign keys are what keep an enrolment from outliving its class or user.
  if (schema.includes("PRIMARY KEY (class_id, user_id)")) {
    pass("duplicate enrolment is blocked by a composite primary key");
  } else {
    fail("class enrolment", "missing composite primary key on class_enrollments");
  }

  if (schema.includes("idx_classes_instructor") && schema.includes("idx_class_enrollments_user")) {
    pass("class lookups are indexed");
  } else {
    fail("class indexes", "missing instructor or enrolment index");
  }

  const access = readProjectFile("src/lib/class-access.ts");
  if (access.includes("rejectUntrustedOrigin") && access.includes('role !== "instructor"')) {
    pass("class routes share an origin-checked instructor guard");
  } else {
    fail("class guards", "shared guard is missing an origin check or role check");
  }

  // Instructor mutations must be scoped by instructor_id so a valid class id
  // belonging to someone else cannot be acted on.
  const store = readProjectFile("src/lib/store/classes-store.ts");
  const scopedStatements = countMatches(store, /instructor_id = \?/g);
  if (scopedStatements >= 4) {
    pass(`class mutations are scoped to the owning instructor (${scopedStatements} statements)`);
  } else {
    fail("class ownership", `only ${scopedStatements} statements scope by instructor_id`);
  }

  if (store.includes("DELETE FROM class_enrollments") && !store.includes("DELETE FROM users")) {
    pass("removing a student deletes only the enrolment row");
  } else {
    fail("student removal", "removal path may touch accounts or progress");
  }
}

function validateLabHealthManager() {
  const restartRoute = readProjectFile("src/app/api/labs/restart/route.ts");

  if (restartRoute.includes('role !== "instructor"')) {
    pass("lab restart route is instructor protected");
  } else {
    fail("lab restart protection", "missing instructor role guard");
  }

  if (restartRoute.includes("rejectUntrustedOrigin") && restartRoute.includes("checkRateLimit")) {
    pass("lab restart route is origin checked and rate limited");
  } else {
    fail("lab restart hardening", "missing origin check or rate limit");
  }

  const labHealth = readProjectFile("src/lib/lab-health.ts");

  // Service names must come from the challenge catalog, never from the request,
  // and the command must be spawned with an argument array rather than a shell
  // string so nothing from a request can become part of a command line.
  if (labHealth.includes("getKnownServiceNames") && labHealth.includes("known.includes(serviceName)")) {
    pass("lab restart validates service names against an allowlist");
  } else {
    fail("lab restart allowlist", "service name is not checked against known compose services");
  }

  if (labHealth.includes("execFile") && !labHealth.includes("shell: true")) {
    pass("docker commands run without a shell");
  } else {
    fail("docker command safety", "commands may be run through a shell");
  }

  // A bare "4010:4010" publishes on every interface, which would put the
  // deliberately vulnerable labs on the classroom network. Each mapping must
  // pin the host side to loopback.
  const compose = readProjectFile("docker-compose.yml");
  const mappings = [...compose.matchAll(/^\s*-\s*"([^"]+)"\s*$/gm)].map((match) => match[1]);
  const exposed = mappings.filter((mapping) => !mapping.startsWith("127.0.0.1:"));

  if (mappings.length > 0 && exposed.length === 0) {
    pass(`all ${mappings.length} lab ports are bound to loopback only`);
  } else {
    fail("lab exposure", `published on all interfaces: ${exposed.join(", ") || "no port mappings found"}`);
  }
}

function validateDocs() {
  [
    "docs/RUN_LOCALLY.md",
    "docs/GUIDE_CONSOLE.md",
    "docs/DATABASE_PLAN.md",
    "docs/REAL_USER_PLATFORM_PLAN.md",
  ].forEach(requireFile);
}

validateChallengeCatalog();
validateRoutesAndSafety();
validateNewPlatformRoutes();
validateLabHealthManager();
validateClassManagement();
validateDocs();

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? "ok" : "fail"} - ${check.label}`);
}

if (failed.length) {
  console.error(`\nVulnMentor validation failed: ${failed.length} check(s).`);
  process.exitCode = 1;
} else {
  console.log(`\nVulnMentor validation passed: ${checks.length} checks.`);
}
