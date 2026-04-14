import {
  PrismaClient,
  SubjectName,
  ExamName,
  AttemptStatus,
} from "@prisma/client";
import { database } from "../lib/database";
import { questionBitmapRegistry } from "../services/uniqueCountService";
import ApiError from "../utils/ApiError";

class ChapterWisePractice {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  // API #3 & #4 combined logic: Get Chapter Info and Questions using Redis Bitmap
  public async getAllPracticeAttemptsRaw(studentId: string) {
    return this.db.chapterWiseQuestionAttemptStatus.findMany({
      where: { studentId },
      include: {
        question: {
          select: {
            type: true,
            subjects: { select: { name: true } },
          },
        },
      },
    });
  }

  // API #3 & #4 combined logic: Get Chapter Info and Questions using Redis Bitmap
  public async getChapterQuestionsWithStats(
    chapterId: string,
    studentId: string,
  ) {
    // Take all questions from DB for the chapter
    const questions = await this.db.questions.findMany({
      where: { chapterId },
      include: {
        papers: {
          include: {
            exam: true,
          },
        },
        options: true,
        solution: true,
        chapterWiseAttempts: {
          where: { studentId },
          orderBy: { created_at: "desc" },
          take: 1, // Optional context if frontend still needs latest user answer draft
        },
      },
    });

    // Sort descending by paper year
    questions.sort((a, b) => {
      const yearA = a.papers?.year ?? 0;
      const yearB = b.papers?.year ?? 0;
      return yearB - yearA;
    });

    // We check the bitmap to get ALL attempted questions for this student
    const { questionIds: attemptedIdsList } =
      await questionBitmapRegistry.getAttemptedQuestionIds(studentId);
    const attemptedSet = new Set(attemptedIdsList);

    let totalMainQuestions = 0;
    let totalAdvancedQuestions = 0;
    let uniqueSolvedMain = 0;
    let uniqueSolvedAdvanced = 0;

    // We augment the question JSON with the attempt status
    const mappedQuestions = questions.map((q) => {
      const isMains = q.papers?.exam?.name === ExamName.JEE_MAIN;
      if (isMains) totalMainQuestions++;
      else totalAdvancedQuestions++;

      const isAttemptedSuccessfully = attemptedSet.has(q.id);

      if (isAttemptedSuccessfully) {
        if (isMains) uniqueSolvedMain++;
        else uniqueSolvedAdvanced++;
      }

      return {
        ...q,
        attemptStatus: isAttemptedSuccessfully
          ? "Successfully attempted"
          : "Not successfully done",
      };
    });

    return {
      stats: {
        totalQuestions: questions.length,
        totalMainQuestions,
        totalAdvancedQuestions,
        uniqueSolvedMainQuestions: uniqueSolvedMain,
        uniqueSolvedAdvancedQuestions: uniqueSolvedAdvanced,
        totalUniqueSolved: uniqueSolvedMain + uniqueSolvedAdvanced,
      },
      jeeMain: mappedQuestions.filter(q => q.papers?.exam?.name === ExamName.JEE_MAIN),
      jeeAdvanced: mappedQuestions.filter(q => q.papers?.exam?.name === ExamName.JEE_ADVANCED),
    };
  }

  // Wrappers for controllers
  public async getChapterInfo(chapterId: string, studentId: string) {
    const data = await this.getChapterQuestionsWithStats(
      chapterId,
      studentId,
    );
    return data;
  }

  
  
  
  // API #5: Get attempt history for a specific question
  public async getQuestionAttemptsHistory(
    questionId: string,
    studentId: string,
  ) {
    // 1. Fetch from Redis in case there is a pending/active update not yet in DB
    const { chapterWiseCacheService } =
      await import("../services/chapterWiseCacheService");
    const activeRedisAttempt = await chapterWiseCacheService.getAttemptData(
      studentId,
      questionId,
    );

    const chapterAttempts =
      await this.db.chapterWiseQuestionAttemptStatus.findMany({
        where: { questionId, studentId },
        orderBy: { created_at: "desc" },
      });
    
    const testAttempts = await this.db.testQuestionAttemptStatus.findMany({
      where: { questionId, studentId },
      include: {
        testStatus: {
          include: {
            papers: { select: { exam: true, year: true, date: true } },
          },
        },
      },
      orderBy: { updated_at: "desc" },
    });

    return {
      activeAttempt: activeRedisAttempt || null,
      chapterAttempts,
      testAttempts,
    };
  }

  // Upsert or insert new attempt
  public async saveQuestionAttempt(data: {
    studentId: string;
    questionId: string;
    status: AttemptStatus;
    isCorrect: boolean;
    marksObtained: number;
    timeSpent: number;
    userAnswer: string[];
    isFinalSubmit: boolean;
  }) {
    let latestAttempt =
      await this.db.chapterWiseQuestionAttemptStatus.findFirst({
        where: {
          studentId: data.studentId,
          questionId: data.questionId,
        },
        orderBy: { created_at: "desc" },
      });

    if (latestAttempt && !latestAttempt.isAnalyzed && !data.isFinalSubmit) {
      // If the latest record is already 'answered', it means the final evaluation is saved.
      // We should NOT overwrite it with a heartbeat update (stale time/status).
      if (latestAttempt.questionStatus === AttemptStatus.answered) {
        return latestAttempt;
      }

      return this.db.chapterWiseQuestionAttemptStatus.update({
        where: { id: latestAttempt.id },
        data: {
          timeSpent: data.timeSpent,
          userAnswer: data.userAnswer,
          questionStatus: data.status,
        },
      });
    }

    if (
      latestAttempt &&
      latestAttempt.questionStatus !== AttemptStatus.answered
    ) {
      return this.db.chapterWiseQuestionAttemptStatus.update({
        where: { id: latestAttempt.id },
        data: {
          timeSpent: data.timeSpent,
          userAnswer: data.userAnswer,
          questionStatus: data.status,
          isCorrect: data.isCorrect,
          marksObtained: data.marksObtained,
          isAnalyzed: data.isFinalSubmit ? false : latestAttempt.isAnalyzed,
        },
      });
    }

    return this.db.chapterWiseQuestionAttemptStatus.create({
      data: {
        studentId: data.studentId,
        questionId: data.questionId,
        questionStatus: data.status,
        isCorrect: data.isCorrect,
        marksObtained: data.marksObtained,
        timeSpent: data.timeSpent,
        userAnswer: data.userAnswer,
        isAnalyzed: false,
      },
    });
  }
}

export const chapterWisePractice = new ChapterWisePractice(database);
