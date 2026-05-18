// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

import { ExamName } from "@prisma/client";

export interface SubjectStats {
  totalQuestions: number;
  attempt:        number;
  marks:          number;
  timeTaken:      number;
  positiveMarks:  number;
  maxMarks:       number;
  paritalMarks:   number; // keeping typo for consistency
  negativeMarks:  number;
  correct:        number;
  partial:        number;
  wrong:          number;
  accuracy:       number;
}



export interface QuestionTypeStat {
  totalQuestions: number;
  attempt:        number;
  correct:        number;
  partial:        number;
  wrong:          number;
  positiveMarks:  number;
  maxMarks:       number;
  partialMarks:   number;
  negativeMarks:  number;
  marks:          number;
  timeTaken:      number;
  accuracy:       number;
}



export interface ChapterStat {
  chapterId:      string;
  chapterName:    string;
  subjectName:    string;
  totalQuestions: number;
  attempt:        number;
  correct:        number;
  partial:        number;
  wrong:          number;
  positiveMarks:  number;
  maxMarks:       number;
  partialMarks:   number;
  negativeMarks:  number;
  marks:          number;
  timeTaken:      number;
  accuracy:       number;
}



export interface OverallStats {
  totalQuestions:         number;
  totalAttempted:         number;
  totalCorrect:           number;
  totalPartial:           number;
  overallAccuracy:        number;
  totalTimeTaken:         number;
  averageTimePerQuestion: number;
  totalScore?:            number;
  maxScore?:              number;
}



export interface SummaryReport {
  exam:          ExamName;
  math:          SubjectStats;
  physics:       SubjectStats;
  chemistry:     SubjectStats;
  overall:       OverallStats;
  questionTypes: Record<string, QuestionTypeStat>;
  chapterWise:   ChapterStat[];
}


export interface SubjectIds {
  mathematicsId: string;
  physicsId:     string;
  chemistryId:   string;
}

export interface QuestionTypeStat {
    totalQuestions: number;
    attempt:        number;
    correct:        number;
    partial:        number;
    wrong:          number;
    positiveMarks:  number;
    maxMarks:       number;
    partialMarks:   number;
    negativeMarks:  number;
    marks:          number;
    timeTaken:      number;
    accuracy:       number;
}

export interface ChapterStat {
    chapterId:      string;
    chapterName:    string;
    subjectName:    string;
    totalQuestions: number;
    attempt:        number;
    correct:        number;
    partial:        number;
    wrong:          number;
    positiveMarks:  number;
    maxMarks:       number;
    partialMarks:   number;
    negativeMarks:  number;
    marks:          number;
    timeTaken:      number;
    accuracy:       number;
}