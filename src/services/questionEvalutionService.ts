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
      // Fetch question data without JSON columns to avoid TiDB adapter crash
      const questionData = await this.db.questions.findUnique({
        where: { id: input.questionId },
        select: {
          id: true,
          type: true,
          positiveMarks: true,
          negativeMarks: true,
          subjectId: true,
          chapterId: true,
          subjects: true,
          chapters: true,
          papers: {
            include: {
              exam: true,
            },
          },
        },
      });

      if (!questionData) throw new Error(`Question not found: ${input.questionId}`);

      // Fetch correctAnswer using a raw query to bypass Prisma JSON serialization bug
      const rawAns: any = await this.db.$queryRawUnsafe(
        `SELECT CAST(correctAnswer AS CHAR) as correctAnswer FROM questions WHERE id = '${input.questionId}'`
      );
      
      let parsedCorrectAnswer: string[] = [];
      if (rawAns && rawAns.length > 0 && rawAns[0].correctAnswer) {
        try {
          parsedCorrectAnswer = JSON.parse(rawAns[0].correctAnswer);
        } catch (e) {
          console.error("Error parsing correctAnswer:", e);
        }
      }

      const evaluator      = new AnswerVerifyService();
      const correctAnswer = this.toStringArray(parsedCorrectAnswer);

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
