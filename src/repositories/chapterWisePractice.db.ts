import {
  PrismaClient,
  SubjectName,
  ExamName,
  AttemptStatus,
} from "@prisma/client";
import { database } from "../lib/database";
import { questionBitmapRegistry } from "../services/uniqueCountService";
import ApiError from "../utils/ApiError";
import { question } from "./question.db";

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
    // 1. Fetch unencrypted questions with signed URLs and HTML formatting
    const questionList = await question.getQuestionsWithSignedUrls(chapterId);

    // 2. Sort descending by paper year
    questionList.sort((a, b) => {
      const yearA = a.papers?.year ?? 0;
      const yearB = b.papers?.year ?? 0;
      return yearB - yearA;
    });

    // 3. Sync the bitmap from DB before reading it.
    await questionBitmapRegistry.syncFromDB(studentId);

    // 4. Check the bitmap to get ALL attempted questions
    const { questionIds: attemptedIdsList } =
      await questionBitmapRegistry.getAttemptedQuestionIds(studentId);
    const attemptedSet = new Set(attemptedIdsList);

    let totalMainQuestions = 0;
    let totalAdvancedQuestions = 0;
    let uniqueSolvedMain = 0;
    let uniqueSolvedAdvanced = 0;

    // 5. Augment the question JSON with attempt status
    const mappedQuestions = questionList.map((q) => {
      // You can use q.exam here because our new method maps it properly
      const isMains = q.exam === ExamName.JEE_MAIN;
      
      if (isMains) totalMainQuestions++;
      else totalAdvancedQuestions++;

      const isAttemptedSuccessfully = attemptedSet.has(q.id);

      if (isAttemptedSuccessfully) {
        if (isMains) uniqueSolvedMain++;
        else uniqueSolvedAdvanced++;
      }

      // 6. Strip internal Prisma relations before sending to the client
      const { papers, chapters, subjects, paperId, chapterId, subjectId, image, comprehensionImage, ...cleanQuestion } = q;

      return {
        ...cleanQuestion,
        attemptStatus: isAttemptedSuccessfully
          ? "Successfully attempted"
          : "Not successfully done",
      };
    });

    return {
      stats: {
        totalQuestions: questionList.length,
        totalMainQuestions,
        totalAdvancedQuestions,
        uniqueSolvedMainQuestions: uniqueSolvedMain,
        uniqueSolvedAdvancedQuestions: uniqueSolvedAdvanced,
        totalUniqueSolved: uniqueSolvedMain + uniqueSolvedAdvanced,
      },
      jeeMain: mappedQuestions.filter(q => q.exam === ExamName.JEE_MAIN),
      jeeAdvanced: mappedQuestions.filter(q => q.exam === ExamName.JEE_ADVANCED),
    };
  }

  // Wrappers for controllers
  public async getChapterInfo(chapterId: string, studentId: string) {
    const data = await this.getChapterQuestionsWithStats(chapterId, studentId);
    return data;
  }

  // API #5: Get attempt history for a specific question
  public async getQuestionAttemptsHistory(
    questionId: string,
    studentId: string,
  ) {
    const { chapterWiseCacheService } =
      await import("../services/chapterWiseCacheService");
    const { cacheService } = await import("../lib/caching");

    // ── 1. Check Redis for pending chapter-wise attempt ────────────────────────
    const activeRedisAttempt = await chapterWiseCacheService.getAttemptData(
      studentId,
      questionId,
    );

    // ── 2. Fetch DB chapter attempts ───────────────────────────────────────────
    const chapterAttempts =
      await this.db.chapterWiseQuestionAttemptStatus.findMany({
        where: { questionId, studentId },
        orderBy: { created_at: "desc" },
      });

    // ── 3. Merge Redis pending chapter attempt into chapterAttempts ───────────
    const mergedChapterAttempts = activeRedisAttempt
      ? [
          {
            id: `pending-${questionId}`,
            questionId,
            studentId,
            questionStatus: activeRedisAttempt.status as any,
            isCorrect: activeRedisAttempt.isCorrect ?? false,
            marksObtained: activeRedisAttempt.marksObtained ?? 0,
            timeSpent: activeRedisAttempt.timeSpent,
            userAnswer: activeRedisAttempt.userAnswer,
            created_at: new Date(),
            isAnalyzed: false,
            isPending: true,
          },
          ...chapterAttempts,
        ]
      : chapterAttempts;

    // ── 4. Fetch DB test attempts ──────────────────────────────────────────────
    const dbTestAttempts = await this.db.testQuestionAttemptStatus.findMany({
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

    // ── 5. Check Redis for pending test attempts ───────────────────────────────
    // After submitTest, data lives in Redis under:
    //   testUpperLayer  → { testId: [{ id, created_at }] }
    //   ${studentId}:${testStatusId}:${created_at} → evaluation report (finalVerdict[])
    // The analytics worker clears these keys after it has written to DB.
    const pendingTestAttempts: any[] = [];
    try {
      const upperLayer = await cacheService.getCache(`${studentId}:testUpperLayer`);

      if (upperLayer && Array.isArray(upperLayer.testId)) {
        // Build a Set of testStatusIds already in DB so we don't double-show
        const dbTestStatusIds = new Set(dbTestAttempts.map((a) => a.testStatusId));

        for (const entry of upperLayer.testId) {
          // Only check tests NOT yet written to DB
          if (dbTestStatusIds.has(entry.id)) continue;

          const evalReport = await cacheService.getCache(
            `${studentId}:${entry.id}:${entry.created_at}`,
          );
          if (!evalReport?.finalVerdict) continue;

          const match = evalReport.finalVerdict.find(
            (q: any) => q.questionId === questionId,
          );
          if (!match) continue;

          pendingTestAttempts.push({
            id: `pending-test-${entry.id}-${questionId}`,
            questionId,
            testStatusId: entry.id,
            studentId,
            isCorrect: match.verdict === "correct",
            status: match.userAnswer?.length > 0 ? "answered" : "notAnswered",
            marksObtained: match.marks ?? 0,
            timeSpent: match.timeSpent ?? 0,
            userAnswer: match.userAnswer ?? [],
            isVisited: match.isVisited ?? false,
            markedForReview: match.markedForReview ?? false,
            isAnalyzed: false,
            updated_at: new Date(),
            isPending: true, // synthetic flag — analytics not yet in DB
            testStatus: {
              id: entry.id,
              studentId,
              status: "COMPLETED",
              created_at: entry.created_at,
              papers: null, // not available in Redis; frontend can ignore
            },
          });
        }
      }
    } catch (err) {
      // Non-critical — DB test attempts are still returned
      console.warn("[getQuestionAttemptsHistory] Redis test check failed:", err);
    }

    // Pending Redis entries go first, then DB entries
    const mergedTestAttempts = [...pendingTestAttempts, ...dbTestAttempts];

    return {
      chapterAttempts: mergedChapterAttempts,
      testAttempts: mergedTestAttempts,
    };
  }


  // Save or update attempt
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
    const latestAttempt =
      await this.db.chapterWiseQuestionAttemptStatus.findFirst({
        where: {
          studentId: data.studentId,
          questionId: data.questionId,
        },
        orderBy: { created_at: "desc" },
      });

    // ── FINAL SUBMIT PATH ──────────────────────────────────────────────────────
    if (data.isFinalSubmit) {
      // Find the current in-progress row (not yet answered).
      // This is the row that belongs to the current attempt session.
      const pendingAttempt =
        await this.db.chapterWiseQuestionAttemptStatus.findFirst({
          where: {
            studentId: data.studentId,
            questionId: data.questionId,
            questionStatus: { not: AttemptStatus.answered },
          },
          orderBy: { created_at: "desc" },
        });

      if (pendingAttempt) {
        // Normal path: finalize the current in-progress row
        return this.db.chapterWiseQuestionAttemptStatus.update({
          where: { id: pendingAttempt.id },
          data: {
            timeSpent: data.timeSpent,
            userAnswer: data.userAnswer,
            questionStatus: data.status,
            isCorrect: data.isCorrect,
            marksObtained: data.marksObtained,
            isAnalyzed: false,
          },
        });
      }

      if (latestAttempt) {
        // Nack+retry protection: no in-progress row (already answered by a prior
        // successful write). Update the latest row idempotently — do NOT create a duplicate.
        return this.db.chapterWiseQuestionAttemptStatus.update({
          where: { id: latestAttempt.id },
          data: {
            timeSpent: data.timeSpent,
            userAnswer: data.userAnswer,
            questionStatus: data.status,
            isCorrect: data.isCorrect,
            marksObtained: data.marksObtained,
            isAnalyzed: false,
          },
        });
      }

      // No rows at all — user submitted without any heartbeat (edge case)
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

    // ── HEARTBEAT / UPDATE PATH ────────────────────────────────────────────────
    if (latestAttempt) {
      if (latestAttempt.questionStatus === AttemptStatus.answered) {
        // The previous attempt is fully done. The user has opened the question
        // again — create a NEW in-progress row for this fresh session.
        return this.db.chapterWiseQuestionAttemptStatus.create({
          data: {
            studentId: data.studentId,
            questionId: data.questionId,
            questionStatus: data.status,
            isCorrect: false,
            marksObtained: 0,
            timeSpent: data.timeSpent,
            userAnswer: data.userAnswer,
            isAnalyzed: false,
          },
        });
      }

      // Update the existing in-progress row
      return this.db.chapterWiseQuestionAttemptStatus.update({
        where: { id: latestAttempt.id },
        data: {
          timeSpent: data.timeSpent,
          userAnswer: data.userAnswer,
          questionStatus: data.status,
        },
      });
    }

    // No prior rows — create the very first in-progress row
    return this.db.chapterWiseQuestionAttemptStatus.create({
      data: {
        studentId: data.studentId,
        questionId: data.questionId,
        questionStatus: data.status,
        isCorrect: false,
        marksObtained: 0,
        timeSpent: data.timeSpent,
        userAnswer: data.userAnswer,
        isAnalyzed: false,
      },
    });
  }
}

export const chapterWisePractice = new ChapterWisePractice(database);
