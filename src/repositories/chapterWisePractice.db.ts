import {
  PrismaClient,
  SubjectName,
  ExamName,
  AttemptStatus,
} from "@prisma/client";
import { database } from "../lib/database";
import { questionBitmapRegistry } from "../services/uniqueCountService";
import { question } from "./question.db";
import { chapter } from "./chapter.db";

class ChapterWisePractice {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

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
  public async getChapterQuestionsWithStats(
    chapterId: string,
    studentId: string,
  ) {
    const { redisConfig, questionRedisclient, REDIS_CACHE_EXPIRATION } = await import("../lib/redis");

    const redisKey = redisConfig.getRedisChapterDataUsingChapterId(chapterId);
    let questionList: any[] = [];
    const cachedQuestions = await questionRedisclient.get(redisKey);

    if (cachedQuestions) {
      questionList = JSON.parse(cachedQuestions);
    } else {
      questionList = await question.getQuestionsWithSignedUrls(chapterId);
      await questionRedisclient.setEx(redisKey, REDIS_CACHE_EXPIRATION, JSON.stringify(questionList));
    }

    const bookmarkedSet = await question.getBookmarkedQuestionIds(studentId, chapterId);

    questionList.sort((a: any, b: any) => {
      const yearA = a.papers?.year ?? 0;
      const yearB = b.papers?.year ?? 0;
      return yearB - yearA;
    });

   

    const { questionIds: attemptedIdsList } =
      await questionBitmapRegistry.getAttemptedQuestionIds(studentId);
    const attemptedSet = new Set(attemptedIdsList);

    let totalMainQuestions = 0;
    let totalAdvancedQuestions = 0;
    let uniqueSolvedMain = 0;
    let uniqueSolvedAdvanced = 0;

    const mappedQuestions = questionList.map((q: any) => {
      const isMains = q.exam === ExamName.JEE_MAIN;
      
      if (isMains) totalMainQuestions++;
      else totalAdvancedQuestions++;

      const isAttemptedSuccessfully = attemptedSet.has(q.id);
      const isBookmarked = bookmarkedSet.has(q.id);

      if (isAttemptedSuccessfully) {
        if (isMains) uniqueSolvedMain++;
        else uniqueSolvedAdvanced++;
      }

      const { ...cleanQuestion } = q;

      return {
        ...cleanQuestion,
        isBookmarked,
        attemptStatus: isAttemptedSuccessfully
          ? "Successfully attempted"
          : "Not successfully done",
      };
    });

    const chapterData = await chapter.gettingChapterDetails(chapterId); 

    return {
      stats: {
        totalQuestions: questionList.length,
        totalMainQuestions,
        totalAdvancedQuestions,
        uniqueSolvedMainQuestions: uniqueSolvedMain,
        uniqueSolvedAdvancedQuestions: uniqueSolvedAdvanced,
        totalUniqueSolved: uniqueSolvedMain + uniqueSolvedAdvanced,
      },
      chapterData,
      jeeMain: mappedQuestions.filter((q: any) => q.exam === ExamName.JEE_MAIN),
      jeeAdvanced: mappedQuestions.filter((q: any) => q.exam === ExamName.JEE_ADVANCED),
    };
  }

  
  // API #5: Get attempt history for a specific question
  public async getQuestionAttemptsHistory(
    questionId: string,
    studentId: string,
  ) {
    const { chapterWiseCacheService } = await import("../services/chapterWiseCacheService");
    const { cacheService } = await import("../lib/caching");

    // ── 1. Fetch Redis pending attempts (NOW AN ARRAY) ─────────────────────────
    const activeRedisAttempts = await chapterWiseCacheService.getAttemptData(
      studentId,
      questionId,
    );

    // ── 2. Fetch ALL DB chapter attempts ───────────────────────────────────────
    const chapterAttemptsRaw = await this.db.chapterWiseQuestionAttemptStatus.findMany({
      where: { questionId, studentId },
      orderBy: { created_at: "desc" },
    });

    const chapterAttempts = chapterAttemptsRaw.map(attempt => ({
      ...attempt,
      isPending: false 
    }));

    // ── 3. Merge Redis Array into History ──────────────────────────────────────
    const pendingRedisAttempts = activeRedisAttempts.map((redisAttempt, index) => ({
      id: `pending-${questionId}-${redisAttempt.timestamp || Date.now()}-${index}`,
      questionId,
      studentId,
      questionStatus: redisAttempt.status as AttemptStatus,
      isCorrect: redisAttempt.isCorrect ?? false,
      marksObtained: redisAttempt.marksObtained ?? 0,
      timeSpent: redisAttempt.timeSpent,
      userAnswer: redisAttempt.userAnswer,
      created_at: new Date(redisAttempt.timestamp || Date.now()),
      isAnalyzed: false,
      isPending: true,
    }));

    // Sort pending attempts so the newest is at the top
    pendingRedisAttempts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    // Combine them (Redis attempts on top, DB attempts below)
    const mergedChapterAttempts = [...pendingRedisAttempts, ...chapterAttempts];

    // ── 4. Fetch DB test attempts ──────────────────────────────────────────────
    const dbTestAttemptsRaw = await this.db.testQuestionAttemptStatus.findMany({
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

    const dbTestAttempts = dbTestAttemptsRaw.map(attempt => ({
      ...attempt,
      isPending: false
    }));

    // ── 5. Check Redis for pending test attempts ───────────────────────────────
    const pendingTestAttempts: any[] = [];
    try {
      const upperLayer = await cacheService.getCache(`${studentId}:testUpperLayer`);

      if (upperLayer && Array.isArray(upperLayer.testId)) {
        const dbTestStatusIds = new Set(dbTestAttempts.map((a) => a.testStatusId));

        for (const entry of upperLayer.testId) {
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
            isPending: true, 
            testStatus: {
              id: entry.id,
              studentId,
              status: "COMPLETED",
              created_at: entry.created_at,
              papers: null, 
            },
          });
        }
      }
    } catch (err) {
      console.warn("[getQuestionAttemptsHistory] Redis test check failed:", err);
    }

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
    const latestAttempt = await this.db.chapterWiseQuestionAttemptStatus.findFirst({
      where: {
        studentId: data.studentId,
        questionId: data.questionId,
      },
      orderBy: { created_at: "desc" },
    });

    // ── FINAL SUBMIT PATH ──────────────────────────────────────────────────────
    if (data.isFinalSubmit) {
      // Find the current in-progress heartbeat row
      const pendingAttempt = await this.db.chapterWiseQuestionAttemptStatus.findFirst({
        where: {
          studentId: data.studentId,
          questionId: data.questionId,
          questionStatus: { not: AttemptStatus.answered },
        },
        orderBy: { created_at: "desc" },
      });

      // 1. If there's an active heartbeat, finalize it.
      if (pendingAttempt) {
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

      // 2. If NO active heartbeat exists, ALWAYS CREATE A NEW ROW.
      // (This handles rapid consecutive submissions or identical test submissions 
      // without swallowing the user's attempt history).
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
        // The previous attempt is fully done. User opened it again — CREATE NEW heartbeat.
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



    public async getChapterInfo(chapterId: string, studentId: string) {
    return await this.getChapterQuestionsWithStats(chapterId, studentId);
  }

}

export const chapterWisePractice = new ChapterWisePractice(database);