"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionBitmapRegistry = void 0;
const redis_1 = require("../lib/redis");
const database_1 = require("../lib/database");
const streakCacheService_1 = require("./streakCacheService");
// ─── Registry ─────────────────────────────────────────────────────────────────
/**
 * QuestionBitmapRegistry
 *
 * Manages a stable questionId → bit-index mapping and exposes
 * per-student Redis bitmap operations to track unique question attempts.
 *
 * Memory cost: 375 bytes per student (for 3000 questions) vs ~108KB with Sets.
 *
 * Key design rules:
 * - The index map is loaded ONCE at startup from Postgres, held in memory.
 * - New questions are always APPENDED — never reordered.
 * - The counter lives in Redis so it survives server restarts.
 * - Redis key per student: `${studentId}:seenQuestions`
 */
class QuestionBitmapRegistry {
    redis;
    db;
    // In-memory maps
    questionToIndex = new Map();
    indexToQuestion = new Map();
    loaded = false;
    // Redis keys
    COUNTER_KEY = "questionBitmap:counter";
    MAP_HASH_KEY = "questionBitmap:indexMap";
    constructor(redisClient, database) {
        this.redis = redisClient;
        this.db = database;
    }
    // ── INITIALISATION ──────────────────────────────────────────────────────────
    async load() {
        if (this.loaded)
            return;
        console.log("[QuestionBitmapRegistry] Loading question index...");
        const questions = await this.db.questions.findMany({
            select: { id: true },
            orderBy: { id: "asc" },
        });
        if (questions.length === 0) {
            console.warn("[QuestionBitmapRegistry] No questions found in DB.");
            this.loaded = true;
            return;
        }
        const existingMap = await this.redis.hGetAll(this.MAP_HASH_KEY);
        const hasExistingMap = Object.keys(existingMap).length > 0;
        if (hasExistingMap) {
            for (const [questionId, indexStr] of Object.entries(existingMap)) {
                const index = parseInt(indexStr, 10);
                this.questionToIndex.set(questionId, index);
                this.indexToQuestion.set(index, questionId);
            }
            console.log(`[QuestionBitmapRegistry] Restored ${this.questionToIndex.size} questions from Redis.`);
        }
        else {
            const pipeline = this.redis.multi();
            questions.forEach((q, index) => {
                this.questionToIndex.set(q.id, index);
                this.indexToQuestion.set(index, q.id);
                pipeline.hSet(this.MAP_HASH_KEY, q.id, index.toString());
            });
            pipeline.set(this.COUNTER_KEY, (questions.length - 1).toString());
            await pipeline.exec();
            console.log(`[QuestionBitmapRegistry] Built fresh index for ${questions.length} questions.`);
        }
        this.loaded = true;
    }
    // ── REGISTER NEW QUESTION ───────────────────────────────────────────────────
    async registerNewQuestion(questionId) {
        this.ensureLoaded();
        if (this.questionToIndex.has(questionId)) {
            return this.questionToIndex.get(questionId);
        }
        const newIndex = await this.redis.incr(this.COUNTER_KEY);
        await this.redis.hSet(this.MAP_HASH_KEY, questionId, newIndex.toString());
        this.questionToIndex.set(questionId, newIndex);
        this.indexToQuestion.set(newIndex, questionId);
        console.log(`[QuestionBitmapRegistry] Registered new question ${questionId} at bit index ${newIndex}.`);
        return newIndex;
    }
    // ── BITMAP OPERATIONS (per student) ─────────────────────────────────────────
    async markAttempted(studentId, questionId) {
        this.ensureLoaded();
        let bitIndex = this.questionToIndex.get(questionId);
        if (bitIndex === undefined) {
            bitIndex = await this.registerNewQuestion(questionId);
        }
        const key = this.studentKey(studentId);
        const previousValue = await this.redis.setBit(key, bitIndex, 1);
        const isFirstAttempt = previousValue === 0;
        // Update streak for EVERY question solved (even if not unique)
        streakCacheService_1.streakCacheService.incrementActivity(studentId, 1).catch(err => console.error("[Streak] Error updating:", err));
        return { isFirstAttempt, bitIndex };
    }
    async markAttemptedBatch(studentId, questionIds) {
        this.ensureLoaded();
        if (questionIds.length === 0)
            return new Map();
        const key = this.studentKey(studentId);
        const results = new Map();
        const pipeline = this.redis.multi();
        const indexedQuestions = [];
        // Pipeline all SETBIT operations
        for (const questionId of questionIds) {
            let bitIndex = this.questionToIndex.get(questionId);
            if (bitIndex === undefined) {
                bitIndex = await this.registerNewQuestion(questionId);
            }
            indexedQuestions.push({ questionId, bitIndex });
            pipeline.setBit(key, bitIndex, 1);
        }
        // Execute pipeline to get all previous bit states
        const previousBits = await pipeline.exec();
        // Map results back to questionIds, routing through unknown to satisfy TS strict mode
        indexedQuestions.forEach(({ questionId, bitIndex }, i) => {
            const previousValue = previousBits[i];
            const isFirstAttempt = previousValue === 0;
            results.set(questionId, { isFirstAttempt, bitIndex });
        });
        // Update streak for ALL questions in the batch (even if not unique)
        if (indexedQuestions.length > 0) {
            streakCacheService_1.streakCacheService.incrementActivity(studentId, indexedQuestions.length).catch(err => console.error("[Streak] Error updating batch:", err));
        }
        return results;
    }
    async hasAttempted(studentId, questionId) {
        this.ensureLoaded();
        const bitIndex = this.questionToIndex.get(questionId);
        if (bitIndex === undefined)
            return false;
        const key = this.studentKey(studentId);
        // Cold start logic
        const keyExists = await this.redis.exists(key);
        if (!keyExists) {
            await this.syncFromDB(studentId);
        }
        const bit = await this.redis.getBit(key, bitIndex);
        return bit === 1;
    }
    async getUniqueAttemptCount(studentId) {
        this.ensureLoaded();
        return await this.redis.bitCount(this.studentKey(studentId));
    }
    async getAttemptedQuestionIds(studentId) {
        this.ensureLoaded();
        const key = this.studentKey(studentId);
        // Cold Start: Check if the key exists, rebuild from Postgres if missing
        const keyExists = await this.redis.exists(key);
        if (!keyExists) {
            console.log(`[QuestionBitmapRegistry] Cold start triggered for student ${studentId}`);
            await this.syncFromDB(studentId);
        }
        const totalUnique = await this.redis.bitCount(key);
        if (totalUnique === 0)
            return { totalUnique: 0, questionIds: [] };
        const pipeline = this.redis.multi();
        // Get all registered bit indexes from our in-memory map
        const allKnownIndexes = Array.from(this.indexToQuestion.keys());
        if (allKnownIndexes.length === 0) {
            return { totalUnique, questionIds: [] };
        }
        for (const bitIndex of allKnownIndexes) {
            pipeline.getBit(key, bitIndex);
        }
        const bitResults = (await pipeline.exec());
        const questionIds = [];
        // Map the 1/0 results back to their actual question IDs
        allKnownIndexes.forEach((bitIndex, arrayPosition) => {
            // bitResults[arrayPosition] is now safely typed as a number
            if (bitResults[arrayPosition] === 1) {
                const qId = this.indexToQuestion.get(bitIndex);
                if (qId) {
                    questionIds.push(qId);
                }
            }
        });
        console.log(`[QuestionBitmapRegistry] Successfully parsed ${questionIds.length} completed questions using Pipeline.`);
        return { totalUnique, questionIds };
    }
    // ── RECONCILIATION ───────────────────────────────────────────────────────────
    async syncFromDB(studentId) {
        this.ensureLoaded();
        const [testAttempts, chapterAttempts] = await Promise.all([
            this.db.testQuestionAttemptStatus.findMany({
                where: { studentId, isCorrect: true },
                select: { questionId: true },
                distinct: ["questionId"],
            }),
            this.db.chapterWiseQuestionAttemptStatus.findMany({
                where: { studentId, isCorrect: true },
                select: { questionId: true },
                distinct: ["questionId"],
            }),
        ]);
        const allIds = new Set([
            ...testAttempts.map((a) => a.questionId),
            ...chapterAttempts.map((a) => a.questionId),
        ]);
        const key = this.studentKey(studentId);
        const pipeline = this.redis.multi();
        // We do NOT delete the key here, ensuring real-time answers stay intact
        if (allIds.size > 0) {
            for (const questionId of allIds) {
                const bitIndex = this.questionToIndex.get(questionId);
                if (bitIndex !== undefined) {
                    pipeline.setBit(key, bitIndex, 1);
                }
            }
        }
        await pipeline.exec();
        console.log(`[QuestionBitmapRegistry] Synced ${allIds.size} unique questions for student ${studentId}.`);
    }
    async clearStudentBitmap(studentId) {
        await this.redis.del(this.studentKey(studentId));
        console.log(`[QuestionBitmapRegistry] Cleared bitmap for student ${studentId}.`);
    }
    // ── LOOKUP HELPERS ───────────────────────────────────────────────────────────
    getIndex(questionId) {
        return this.questionToIndex.get(questionId);
    }
    getQuestionId(index) {
        return this.indexToQuestion.get(index);
    }
    getTotalRegisteredQuestions() {
        return this.questionToIndex.size;
    }
    // ── PRIVATE HELPERS ──────────────────────────────────────────────────────────
    studentKey(studentId) {
        return `${studentId}:seenQuestions`;
    }
    ensureLoaded() {
        if (!this.loaded) {
            throw new Error("[QuestionBitmapRegistry] Registry not loaded. Call load() at server startup first.");
        }
    }
}
// ─── Singleton Export ─────────────────────────────────────────────────────────
exports.questionBitmapRegistry = new QuestionBitmapRegistry(redis_1.questionBitMapRedisclient, database_1.database);
