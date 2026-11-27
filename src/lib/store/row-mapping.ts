import type {
  AttemptRecord,
  GeneratedReportRecord,
  EvidenceNotebookRecord,
  HintUsageRecord,
  QuizResultRecord,
  QuizAnswerRecord,
  StudentSession,
} from "../progress-types";
import type { UserRecord } from "./store-shared";
export type UserRow = {
  id: string;
  name: string;
  email: string;
  usn: string;
  role: string;
  created_at: string;
  last_seen_at: string;
};

export type SessionRow = {
  id: string;
  user_id: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
};

export type AttemptRow = {
  id: string;
  challenge_id: string;
  correct: number;
  flag_preview: string;
  submitted_at: string;
};

export type QuizRow = {
  id: string;
  lesson_slug: string;
  score: number;
  total: number;
  answers: string;
  submitted_at: string;
};

export type HintRow = {
  id: string;
  challenge_id: string;
  hint_index: number;
  viewed_at: string;
};

export type EvidenceRow = {
  id: string;
  challenge_id: string;
  normal_request: string;
  modified_request: string;
  vulnerable_response: string;
  secure_response: string;
  trace_proof: string;
  impact_summary: string;
  root_cause: string;
  fix_recommendation: string;
  updated_at: string;
};

export type ReportRow = {
  id: string;
  challenge_id: string;
  format: string;
  title: string;
  generated_at: string;
};

export function toStudentSession(row: UserRow): StudentSession {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    usn: row.usn,
    role: row.role === "instructor" ? "instructor" : "student",
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

export function toUserRecord(
  row: UserRow & { password_hash: string },
): UserRecord {
  return { ...toStudentSession(row), passwordHash: row.password_hash };
}

export function toAttemptRecord(row: AttemptRow): AttemptRecord {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    correct: row.correct === 1,
    flagPreview: row.flag_preview,
    submittedAt: row.submitted_at,
  };
}

export function toQuizRecord(row: QuizRow): QuizResultRecord {
  return {
    id: row.id,
    lessonSlug: row.lesson_slug,
    score: row.score,
    total: row.total,
    answers: parseAnswers(row.answers),
    submittedAt: row.submitted_at,
  };
}

function parseAnswers(raw: string): QuizAnswerRecord[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toHintRecord(row: HintRow): HintUsageRecord {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    hintIndex: row.hint_index,
    viewedAt: row.viewed_at,
  };
}

export function toEvidenceRecord(row: EvidenceRow): EvidenceNotebookRecord {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    normalRequest: row.normal_request,
    modifiedRequest: row.modified_request,
    vulnerableResponse: row.vulnerable_response,
    secureResponse: row.secure_response,
    traceProof: row.trace_proof,
    impactSummary: row.impact_summary,
    rootCause: row.root_cause,
    fixRecommendation: row.fix_recommendation,
    updatedAt: row.updated_at,
  };
}

export function toReportRecord(row: ReportRow): GeneratedReportRecord {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    format: row.format as GeneratedReportRecord["format"],
    title: row.title,
    generatedAt: row.generated_at,
  };
}
