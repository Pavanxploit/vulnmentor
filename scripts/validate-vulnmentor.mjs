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
    "src/app/roadmap/page.tsx",
    "src/components/academy/roadmap-page.tsx",
    "src/lib/report-generator.ts",
  ].forEach(requireFile);
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
