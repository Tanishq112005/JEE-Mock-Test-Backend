
export interface BitmapCheckResult {
  isFirstAttempt: boolean;
  bitIndex: number;
}

export interface SeenQuestionsResult {
  totalUnique: number;
  questionIds: string[];
}
