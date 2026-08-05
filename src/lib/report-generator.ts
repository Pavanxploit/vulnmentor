import type { Challenge } from "@/data/challenges";
import { csvDocument } from "./csv-safe";
import type { EvidenceNotebookRecord } from "./progress-types";

export type ReportFormat = "markdown" | "json" | "csv";

export type ReportPayload = {
  challenge: Challenge;
  evidence?: EvidenceNotebookRecord;
  generatedAt: string;
};

export function generateReport(payload: ReportPayload, format: ReportFormat) {
  if (format === "json") return generateJsonReport(payload);
  if (format === "csv") return generateCsvReport(payload);
  return generateMarkdownReport(payload);
}

export function getReportContentType(format: ReportFormat) {
  if (format === "json") return "application/json; charset=utf-8";
  if (format === "csv") return "text/csv; charset=utf-8";
  return "text/markdown; charset=utf-8";
}

export function getReportFileName(challenge: Challenge, format: ReportFormat) {
  const extension = format === "json" ? "json" : format === "csv" ? "csv" : "md";
  return `vulnmentor-${challenge.id}-report.${extension}`;
}

function generateMarkdownReport({ challenge, evidence, generatedAt }: ReportPayload) {
  return [
    `# ${challenge.title}`,
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Summary",
    challenge.summary,
    "",
    "## Severity",
    getSeverity(challenge),
    "",
    "## Affected Local Endpoint",
    challenge.lab?.baseUrl ?? "Local lab endpoint not assigned",
    "",
    "## Steps To Reproduce Inside VulnMentor Only",
    ...challenge.teaching.methodology.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Evidence",
    "",
    ...evidenceBlock("Normal request", evidence?.normalRequest),
    ...evidenceBlock("Modified request", evidence?.modifiedRequest),
    ...evidenceBlock("Vulnerable response", evidence?.vulnerableResponse),
    ...evidenceBlock("Secure response", evidence?.secureResponse),
    ...evidenceBlock("Trace/log proof", evidence?.traceProof),
    "## Impact",
    escapeMarkdownProse(evidence?.impactSummary || challenge.impact),
    "",
    "## Root Cause",
    escapeMarkdownProse(evidence?.rootCause || challenge.rootCause),
    "",
    "## Mitigation",
    ...challenge.mitigation.map((item) => `- ${item}`),
    "",
    "## Secure Code Comparison",
    "### Vulnerable Pattern",
    "```ts",
    challenge.code.vulnerable,
    "```",
    "",
    "### Secure Pattern",
    "```ts",
    challenge.code.secure,
    "```",
    "",
    "## Student Fix Recommendation",
    escapeMarkdownProse(evidence?.fixRecommendation || challenge.teaching.reportTemplate),
    "",
    "## Safety Note",
    "This report documents only the VulnMentor local Docker lab. It must not be used as authorization to test real websites, public APIs, college systems, company systems, or third-party targets.",
  ].join("\n");
}

function generateJsonReport({ challenge, evidence, generatedAt }: ReportPayload) {
  return JSON.stringify(
    {
      title: challenge.title,
      severity: getSeverity(challenge),
      affectedLocalEndpoint: challenge.lab?.baseUrl ?? null,
      generatedAt,
      description: challenge.summary,
      stepsToReproduceInsideVulnMentorOnly: challenge.teaching.methodology,
      evidence: evidence ?? null,
      impact: evidence?.impactSummary || challenge.impact,
      rootCause: evidence?.rootCause || challenge.rootCause,
      mitigation: challenge.mitigation,
      secureCodeComparison: challenge.code,
      safetyBoundary: "VulnMentor local Docker labs only.",
    },
    null,
    2,
  );
}

function generateCsvReport(payload: ReportPayload) {
  return csvDocument([
    ["field", "value"],
    ["title", payload.challenge.title],
    ["severity", getSeverity(payload.challenge)],
    ["affected_local_endpoint", payload.challenge.lab?.baseUrl ?? ""],
    ["description", payload.challenge.summary],
    ["normal_request", payload.evidence?.normalRequest ?? ""],
    ["modified_request", payload.evidence?.modifiedRequest ?? ""],
    ["vulnerable_response", payload.evidence?.vulnerableResponse ?? ""],
    ["secure_response", payload.evidence?.secureResponse ?? ""],
    ["trace_proof", payload.evidence?.traceProof ?? ""],
    ["impact", payload.evidence?.impactSummary || payload.challenge.impact],
    ["root_cause", payload.evidence?.rootCause || payload.challenge.rootCause],
    ["fix_recommendation", payload.evidence?.fixRecommendation || payload.challenge.teaching.reportTemplate],
  ]);
}

/**
 * Evidence fields hold raw request and response captures, so they belong in a
 * code block on their own merits. Indented blocks are used rather than fenced
 * ones because they have no terminator sequence: a student cannot break out of
 * them by pasting a fence, which keeps pasted HTML or `javascript:` links inert
 * when the report is later rendered to HTML or PDF.
 */
function evidenceBlock(label: string, value: string | undefined) {
  const text = value?.trim() || "Not filled";
  return [`### ${label}`, "", ...text.split(/\r?\n/).map((line) => `    ${line}`), ""];
}

/**
 * Prose fields stay readable prose, so they are escaped rather than boxed.
 * Angle brackets are neutralised because many Markdown renderers pass raw HTML
 * through, and leading hashes are escaped so evidence text cannot forge a
 * section heading in a report that gets submitted for marks.
 */
function escapeMarkdownProse(value: string) {
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^(\s*)(#{1,6}\s)/gm, "$1\\$2");
}

function getSeverity(challenge: Challenge) {
  if (challenge.difficulty === "Hard") return "High";
  if (challenge.difficulty === "Medium") return "Medium";
  return "Low";
}
