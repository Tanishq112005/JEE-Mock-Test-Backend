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
                    take: 1,
                },
            },
        });
        // Sort descending by paper year
        questions.sort((a, b) => {
            const yearA = a.papers?.year ?? 0;
            const yearB = b.papers?.year ?? 0;
            return yearB - yearA;
        });
        // Sync the bitmap from DB before reading it.
        // This ensures correctness even when the bitmap is stale (e.g. questions answered
        // before markAttempted() was wired into the submit consumer).
        // Going forward this is a cheap no-op since the submit consumer keeps the bitmap live.
        await uniqueCountService_1.questionBitmapRegistry.syncFromDB(studentId);
        // We check the bitmap to get ALL attempted questions for this student
        const { questionIds: attemptedIdsList } = await uniqueCountService_1.questionBitmapRegistry.getAttemptedQuestionIds(studentId);
        const attemptedSet = new Set(attemptedIdsList);
        let totalMainQuestions = 0;
        let totalAdvancedQuestions = 0;
        let uniqueSolvedMain = 0;
        let uniqueSolvedAdvanced = 0;
        // We augment the question JSON with the attempt status
        const mappedQuestions = questions.map((q) => {
            const isMains = q.papers?.exam?.name === client_1.ExamName.JEE_MAIN;
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
            jeeMain: mappedQuestions.filter(q => q.papers?.exam?.name === client_1.ExamName.JEE_MAIN),
            jeeAdvanced: mappedQuestions.filter(q => q.papers?.exam?.name === client_1.ExamName.JEE_ADVANCED),
        };
    }
    // Wrappers for controllers
    async getChapterInfo(chapterId, studentId) {
        const data = await this.getChapterQuestionsWithStats(chapterId, studentId);
        return data;
    }
    // API #5: Get attempt history for a specific question
    async getQuestionAttemptsHistory(questionId, studentId) {
        // 1. Fetch from Redis — this is the live state (pending / just-submitted, not yet in DB)
        const { chapterWiseCacheService } = await Promise.resolve().then(() => __importStar(require("../services/chapterWiseCacheService")));
        const activeRedisAttempt = await chapterWiseCacheService.getAttemptData(studentId, questionId);
        const chapterAttempts = await this.db.chapterWiseQuestionAttemptStatus.findMany({
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
        // 2. If a live Redis entry exists, prepend it into chapterAttempts as a
        //    synthetic pending record so the frontend sees it without a separate field.
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
                    isPending: true, // synthetic flag — not in DB yet
                },
                ...chapterAttempts,
            ]
            : chapterAttempts;
        return {
            chapterAttempts: mergedChapterAttempts,
            testAttempts,
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
