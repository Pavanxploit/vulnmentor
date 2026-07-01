export type UserRole = "student" | "instructor";

export type StudentSession = {
  id: string;
  name: string;
  email: string;
  usn: string;
  role: UserRole;
  createdAt: string;
  lastSeenAt: string;
};

export type AttemptRecord = {
  id: string;
  challengeId: string;
  correct: boolean;
  flagPreview: string;
  submittedAt: string;
};

export type QuizAnswerRecord = {
  question: string;
  selected: string;
  correct: boolean;
};

export type QuizResultRecord = {
  id: string;
  lessonSlug: string;
  score: number;
  total: number;
  answers: QuizAnswerRecord[];
  submittedAt: string;
};

export type HintUsageRecord = {
  id: string;
  challengeId: string;
  hintIndex: number;
  viewedAt: string;
};

export type EvidenceNotebookRecord = {
  id: string;
  challengeId: string;
  normalRequest: string;
  modifiedRequest: string;
  vulnerableResponse: string;
  secureResponse: string;
  traceProof: string;
  impactSummary: string;
  rootCause: string;
  fixRecommendation: string;
  updatedAt: string;
};

export type GeneratedReportRecord = {
  id: string;
  challengeId: string;
  format: "markdown" | "json" | "csv";
  title: string;
  generatedAt: string;
};

export type ProgressState = {
  completed: string[];
  attempts: AttemptRecord[];
  quizResults: QuizResultRecord[];
  hintViews: HintUsageRecord[];
  evidenceNotebooks: EvidenceNotebookRecord[];
  reports: GeneratedReportRecord[];
};

export const emptyProgress: ProgressState = {
  completed: [],
  attempts: [],
  quizResults: [],
  hintViews: [],
  evidenceNotebooks: [],
  reports: [],
};
