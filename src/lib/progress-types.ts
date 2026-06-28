export type StudentSession = {
  id: string;
  name: string;
  usn: string;
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
