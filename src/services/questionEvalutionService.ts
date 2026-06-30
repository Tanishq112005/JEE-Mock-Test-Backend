import { PrismaClient }        from "@prisma/client";
import { database }            from "../lib/database";
import { AnswerVerifyService } from "./answerVerifyService";

// ─────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────

export interface PracticeAttemptInput {
  questionId:      string;
  timeSpent:       number;
  userAnswer:      string[];
  created_at :     Date ; 
}

// ─────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────

export interface PracticeEvaluationResult {
  questionId:      string;
  verdict:         "correct" | "partial" | "wrong" | "unattempted";
  marks:           number;
  positiveMarks:   number;
  negativeMarks:   number;
  correctAnswer:   string[];
  userAnswer:      string[];
  timeSpent:       number;
  type:            string;
  subject:         string;
  subjectId:       string;
  chapterId:       string | null;
  chapterName:     string | null;
  examName:        string | null;
  created_at :     Date ; 
}




// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

class PracticeQuestionEvaluationService {
  private db: PrismaClient;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
  }

  // ══════════════════════════════════════════
  // SINGLE question evaluation
  // ══════════════════════════════════════════

  async evaluate(
    input: PracticeAttemptInput,
  ) {
    try {
      let questionData: any = null;
      let retries = 3;
      let lastError = null;

      while (retries > 0 && !questionData) {
        try {
          questionData = await this.db.questions.findUnique({
            where:   { id: input.questionId },
            include: {
              subjects: true,
              chapters: true,
              papers: {
                include: {
                  exam: true,
                },
              },
            },
          });
          break; // Success
        } catch (error: any) {
          lastError = error;
          retries--;
          if (retries === 0) break;
          // Wait briefly before retrying
          await new Promise(res => setTimeout(res, 500));
        }
      }

      if (!questionData && lastError) {
        throw new Error(`Failed to fetch question after retries. Last error: ${lastError.message}`);
      }

      if (!questionData) throw new Error(`Question not found: ${input.questionId}`);

      const evaluator      = new AnswerVerifyService();
      const correctAnswer = this.toStringArray(questionData.correctAnswer);

      const { verdict: rawVerdict, marks } = evaluator.questionResult(
        input.userAnswer,
        correctAnswer,
        questionData.type,
        questionData.positiveMarks,
        questionData.negativeMarks
      );

      const verdict = rawVerdict as "correct" | "partial" | "wrong" | "unattempted";
     
      return {
        questionId:      questionData.id,
        verdict,
        marks,
        positiveMarks:   questionData.positiveMarks,
        negativeMarks:   questionData.negativeMarks,
        correctAnswer,
        userAnswer:      input.userAnswer,
        timeSpent:       input.timeSpent , 
        type:            questionData.type,
        subject:         questionData.subjects.name,
        subjectId:       questionData.subjectId,
        chapterId:       questionData.chapterId        ?? null,
        chapterName:     questionData.chapters?.name   ?? null,
        examName:        questionData.papers?.exam.name ?? null,
        created_at  :    input.created_at 
      };
    } catch (err: any) {
      throw err;
    }
  }


}

export const practiceQuestionEvaluation = new PracticeQuestionEvaluationService(database);
