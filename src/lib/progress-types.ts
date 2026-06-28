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

export type ProgressState = {
  completed: string[];
  attempts: AttemptRecord[];
};

export const emptyProgress: ProgressState = { completed: [], attempts: [] };
