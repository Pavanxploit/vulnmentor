import type { Challenge } from "@/data/challenges";
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
    `Normal request: ${evidence?.normalRequest || "Not filled"}`,
    `Modified request: ${evidence?.modifiedRequest || "Not filled"}`,
    `Vulnerable response: ${evidence?.vulnerableResponse || "Not filled"}`,
    `Secure response: ${evidence?.secureResponse || "Not filled"}`,
    `Trace/log proof: ${evidence?.traceProof || "Not filled"}`,
    "",
    "## Impact",
    evidence?.impactSummary || challenge.impact,
    "",
    "## Root Cause",
    evidence?.rootCause || challenge.rootCause,
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
    evidence?.fixRecommendation || challenge.teaching.reportTemplate,
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
  const rows = [
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
  ];

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function getSeverity(challenge: Challenge) {
  if (challenge.difficulty === "Hard") return "High";
  if (challenge.difficulty === "Medium") return "Medium";
  return "Low";
}
