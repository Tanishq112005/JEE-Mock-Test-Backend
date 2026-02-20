import { ExamName, questionType, SubjectName } from "@prisma/client";

// ─────────────────────────────────────────────
// Per-subject breakdown
// ─────────────────────────────────────────────

export interface SubjectResult {
  totalQuestions: number;
  attempt:        number;
  marks:          number;
  timeTaken:      number;
  positiveMarks:  number;
  paritalMarks:   number; // typo kept for consistency
  negativeMarks:  number;
  correct:        number;
  partial:        number;
  wrong:          number;
  accuracy:       number;
}

// ─────────────────────────────────────────────
// Per-question-type breakdown
// ─────────────────────────────────────────────

export interface QuestionTypeResult {
  totalQuestions: number;
  attempt:        number;
  correct:        number;
  partial:        number;
  wrong:          number;
  positiveMarks:  number;
  partialMarks:   number;
  negativeMarks:  number;
  marks:          number;
  timeTaken:      number;
  accuracy:       number;
}

// ─────────────────────────────────────────────
// Per-chapter breakdown
// ─────────────────────────────────────────────

export interface ChapterResult {
  chapterId:      string;
  chapterName:    string;
  subjectName:    string;
  totalQuestions: number;
  attempt:        number;
  correct:        number;
  partial:        number;
  wrong:          number;
  positiveMarks:  number;
  partialMarks:   number;
  negativeMarks:  number;
  marks:          number;
  timeTaken:      number;
  accuracy:       number;
}

// ─────────────────────────────────────────────
// Overall totals
// ─────────────────────────────────────────────

export interface OverallResult {
  totalQuestions:         number;
  totalAttempted:         number;
  totalCorrect:           number;
  totalPartial:           number;
  overallAccuracy:        number;
  totalTimeTaken:         number;
  averageTimePerQuestion: number;
}

// ─────────────────────────────────────────────
// Individual question verdict
// ─────────────────────────────────────────────

export interface QuestionVerdict {
  questionId:         string;
  type:               questionType;
  isVisited:          boolean;
  timeSpent:          number;
  markedForReview:    boolean;
  userAnswer:         string[];
  verdict:            string;
  marks:              number;
  totalPositiveMarks: number;
  totalNegativeMarks: number;
  subject:            SubjectName;
  chapterId:          string | null;
  chapterName:        string | null;
}

// ─────────────────────────────────────────────
// Full summary report — return type of testEvaluation.evaluation()
// ─────────────────────────────────────────────

export interface TestEvaluationSummaryReport {
  exam:          ExamName | undefined;
  math:          SubjectResult;
  physics:       SubjectResult;
  chemistry:     SubjectResult;
  overall:       OverallResult;
  questionTypes: Record<string, QuestionTypeResult>;
  chapterWise:   ChapterResult[];
  finalVerdict:  QuestionVerdict[];
}