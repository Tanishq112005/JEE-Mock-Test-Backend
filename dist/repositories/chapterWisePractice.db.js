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
        // 1. Fetch from Redis in case there is a pending/active update not yet in DB
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
        return {
            activeAttempt: activeRedisAttempt || null,
            chapterAttempts,
            testAttempts,
        };
    }
    // Upsert or insert new attempt
    async saveQuestionAttempt(data) {
        let latestAttempt = await this.db.chapterWiseQuestionAttemptStatus.findFirst({
            where: {
                studentId: data.studentId,
                questionId: data.questionId,
            },
            orderBy: { created_at: "desc" },
        });
        if (latestAttempt && !latestAttempt.isAnalyzed && !data.isFinalSubmit) {
            // If the latest record is already 'answered', it means the final evaluation is saved.
            // We should NOT overwrite it with a heartbeat update (stale time/status).
            if (latestAttempt.questionStatus === client_1.AttemptStatus.answered) {
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
        if (latestAttempt &&
            latestAttempt.questionStatus !== client_1.AttemptStatus.answered) {
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
exports.chapterWisePractice = new ChapterWisePractice(database_1.database);
