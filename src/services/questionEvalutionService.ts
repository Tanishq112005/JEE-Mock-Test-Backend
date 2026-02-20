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

interface PracticeEvaluationResult {
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

  // ══════════════════════════════════════════
  // SINGLE question evaluation
  // ══════════════════════════════════════════

  async evaluate(
    input: PracticeAttemptInput,
  ) {
    try {
      const questionData = await this.db.questions.findUnique({
        where:   { id: input.questionId },
        include: {
          subjects: true,
          chapters: true,
          papers: {
            include: {
              exam:           true,
              markingSchemes: true,
            },
          },
        },
      });

      if (!questionData) throw new Error(`Question not found: ${input.questionId}`);

      
      const markingSchemes = questionData.papers?.markingSchemes ?? [];
      const evaluator      = new AnswerVerifyService(markingSchemes);

      const { verdict: rawVerdict, marks } = evaluator.questionResult(
        input.userAnswer,
        questionData.correctAnswer,
        questionData.type,
      );

      const verdict = rawVerdict as "correct" | "partial" | "wrong" | "unattempted";
     
      return {
        questionId:      questionData.id,
        verdict,
        marks,
        positiveMarks:   questionData.positiveMarks,
        negativeMarks:   questionData.negativeMarks,
        correctAnswer:   questionData.correctAnswer,
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