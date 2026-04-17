"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterWisePractice = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../lib/database");
const uniqueCountService_1 = require("../services/uniqueCountService");
const question_db_1 = require("./question.db");
const chapter_db_1 = require("./chapter.db");
class ChapterWisePractice {
    db;
    constructor(database) {
        this.db = database;
    }
    // API #3 & #4 combined logic: Get Chapter Info and Questions using Redis Bitmap
    async getAllPracticeAttemptsRaw(studentId) {
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
    async getChapterQuestionsWithStats(chapterId, studentId) {
        // 1. Fetch unencrypted questions with signed URLs and HTML formatting
        const questionList = await question_db_1.question.getQuestionsWithSignedUrls(chapterId);
        // 2. Sort descending by paper year
        questionList.sort((a, b) => {
            const yearA = a.papers?.year ?? 0;
            const yearB = b.papers?.year ?? 0;
            return yearB - yearA;
        });
        // 3. Sync the bitmap from DB before reading it.
        await uniqueCountService_1.questionBitmapRegistry.syncFromDB(studentId);
        // 4. Check the bitmap to get ALL attempted questions
        const { questionIds: attemptedIdsList } = await uniqueCountService_1.questionBitmapRegistry.getAttemptedQuestionIds(studentId);
        const attemptedSet = new Set(attemptedIdsList);
        let totalMainQuestions = 0;
        let totalAdvancedQuestions = 0;
        let uniqueSolvedMain = 0;
        let uniqueSolvedAdvanced = 0;
        // 5. Augment the question JSON with attempt status
        const mappedQuestions = questionList.map((q) => {
            // You can use q.exam here because our new method maps it properly
            const isMains = q.exam === client_1.ExamName.JEE_MAIN;
            if (isMains)
                totalMainQuestions++;
            else
                totalAdvancedQuestions++;
            const isAttemptedSuccessfully = attemptedSet.has(q.id);
            if (isAttemptedSuccessfully) {
                if (isMains)
                    uniqueSolvedMain++;
                else
                    uniqueSolvedAdvanced++;
            }
            // 6. Strip internal Prisma relations before sending to the client
            const { ...cleanQuestion } = q;
            return {
                ...cleanQuestion,
                attemptStatus: isAttemptedSuccessfully
                    ? "Successfully attempted"
                    : "Not successfully done",
            };
        });
        const chapterData = await chapter_db_1.chapter.gettingChapterDetails(chapterId);
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
            jeeMain: mappedQuestions.filter(q => q.exam === client_1.ExamName.JEE_MAIN),
            jeeAdvanced: mappedQuestions.filter(q => q.exam === client_1.ExamName.JEE_ADVANCED),
        };
    }
    // Wrappers for controllers
    async getChapterInfo(chapterId, studentId) {
        const data = await this.getChapterQuestionsWithStats(chapterId, studentId);
        return data;
    }
    // API #5: Get attempt history for a specific question
    async getQuestionAttemptsHistory(questionId, studentId) {
        const { chapterWiseCacheService } = await Promise.resolve().then(() => __importStar(require("../services/chapterWiseCacheService")));
        const { cacheService } = await Promise.resolve().then(() => __importStar(require("../lib/caching")));
        // ── 1. Check Redis for pending chapter-wise attempt ────────────────────────
        const activeRedisAttempt = await chapterWiseCacheService.getAttemptData(studentId, questionId);
        // ── 2. Fetch DB chapter attempts ───────────────────────────────────────────
        const chapterAttempts = await this.db.chapterWiseQuestionAttemptStatus.findMany({
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
                    questionStatus: activeRedisAttempt.status,
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
        const pendingTestAttempts = [];
        try {
            const upperLayer = await cacheService.getCache(`${studentId}:testUpperLayer`);
            if (upperLayer && Array.isArray(upperLayer.testId)) {
                // Build a Set of testStatusIds already in DB so we don't double-show
                const dbTestStatusIds = new Set(dbTestAttempts.map((a) => a.testStatusId));
                for (const entry of upperLayer.testId) {
                    // Only check tests NOT yet written to DB
                    if (dbTestStatusIds.has(entry.id))
                        continue;
                    const evalReport = await cacheService.getCache(`${studentId}:${entry.id}:${entry.created_at}`);
                    if (!evalReport?.finalVerdict)
                        continue;
                    const match = evalReport.finalVerdict.find((q) => q.questionId === questionId);
                    if (!match)
                        continue;
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
        }
        catch (err) {
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
    async saveQuestionAttempt(data) {
        const latestAttempt = await this.db.chapterWiseQuestionAttemptStatus.findFirst({
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
            const pendingAttempt = await this.db.chapterWiseQuestionAttemptStatus.findFirst({
                where: {
                    studentId: data.studentId,
                    questionId: data.questionId,
                    questionStatus: { not: client_1.AttemptStatus.answered },
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
            if (latestAttempt.questionStatus === client_1.AttemptStatus.answered) {
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
exports.chapterWisePractice = new ChapterWisePractice(database_1.database);
