"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionBitmapRegistry = void 0;
const redis_1 = require("../lib/redis");
const database_1 = require("../lib/database");
// ─── Types ────────────────────────────────────────────────────────────────────
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
 *  - The index map is loaded ONCE at startup from Postgres, held in memory.
 *  - New questions are always APPENDED — never reordered — to keep bitmaps valid.
 *  - The counter lives in Redis so it survives server restarts.
 *  - Redis key per student: `${studentId}:seenQuestions` (type: bitmap / string)
 */
class QuestionBitmapRegistry {
    redis;
    // In-memory maps — loaded once, never mutated except via registerNewQuestion()
    questionToIndex = new Map();
    indexToQuestion = new Map();
    loaded = false;
    // Redis keys
    COUNTER_KEY = "questionBitmap:counter"; // current max index
    MAP_HASH_KEY = "questionBitmap:indexMap"; // questionId -> index
    db;
    constructor(redisClient, database) {
        this.redis = redisClient;
        this.db = database;
    }
    // ── INITIALISATION ──────────────────────────────────────────────────────────
    /**
     * Call ONCE at server startup.
     * Loads all existing questions from Postgres, assigns stable bit indices,
     * and persists the mapping to Redis (for recovery after restarts).
     *
     * Safe to call multiple times — idempotent.
     */
    async load() {
        if (this.loaded)
            return;
        console.log("[QuestionBitmapRegistry] Loading question index...");
        // 1. Pull all existing questionIds ordered stably
        const questions = await this.db.questions.findMany({
            select: { id: true },
            orderBy: { id: "asc" }, // ascending UUID = deterministic order
        });
        if (questions.length === 0) {
            console.warn("[QuestionBitmapRegistry] No questions found in DB.");
            this.loaded = true;
            return;
        }
        // 2. Check if Redis already has a mapping (server restart case)
        const existingMap = await this.redis.hGetAll(this.MAP_HASH_KEY);
        const hasExistingMap = Object.keys(existingMap).length > 0;
        if (hasExistingMap) {
            // Rebuild in-memory maps from Redis (fast path after restart)
            for (const [questionId, indexStr] of Object.entries(existingMap)) {
                const index = parseInt(indexStr, 10);
                this.questionToIndex.set(questionId, index);
                this.indexToQuestion.set(index, questionId);
            }
            console.log(`[QuestionBitmapRegistry] Restored ${this.questionToIndex.size} questions from Redis.`);
        }
        else {
            // First ever load — build map from Postgres and persist to Redis
            const pipeline = this.redis.multi();
            questions.forEach((q, index) => {
                this.questionToIndex.set(q.id, index);
                this.indexToQuestion.set(index, q.id);
                pipeline.hSet(this.MAP_HASH_KEY, q.id, index.toString());
            });
            // Store the current max index as counter
            pipeline.set(this.COUNTER_KEY, (questions.length - 1).toString());
            await pipeline.exec();
            console.log(`[QuestionBitmapRegistry] Built fresh index for ${questions.length} questions.`);
        }
        this.loaded = true;
    }
    // ── REGISTER NEW QUESTION ───────────────────────────────────────────────────
    /**
     * Call this whenever a NEW question is inserted into the DB.
     * Assigns the next available bit index and updates both Redis and in-memory maps.
     *
     * IMPORTANT: Never call this for existing questions — it will assign a duplicate index.
     */
    async registerNewQuestion(questionId) {
        this.ensureLoaded();
        // Guard against double-registration
        if (this.questionToIndex.has(questionId)) {
            console.warn(`[QuestionBitmapRegistry] Question ${questionId} is already registered at index ${this.questionToIndex.get(questionId)}.`);
            return this.questionToIndex.get(questionId);
        }
        // Atomically increment and get the new index
        const newIndex = await this.redis.incr(this.COUNTER_KEY);
        // Persist to Redis hash
        await this.redis.hSet(this.MAP_HASH_KEY, questionId, newIndex.toString());
        // Update in-memory maps
        this.questionToIndex.set(questionId, newIndex);
        this.indexToQuestion.set(newIndex, questionId);
        console.log(`[QuestionBitmapRegistry] Registered new question ${questionId} at bit index ${newIndex}.`);
        return newIndex;
    }
    // ── BITMAP OPERATIONS (per student) ─────────────────────────────────────────
    /**
     * Mark a question as attempted by a student.
     * Returns whether this is the student's FIRST EVER attempt on this question
     * (across both test mode and chapter-wise practice).
     */
    async markAttempted(studentId, questionId) {
        this.ensureLoaded();
        let bitIndex = this.questionToIndex.get(questionId);
        if (bitIndex === undefined) {
            console.warn(`[QuestionBitmapRegistry] Unknown questionId: ${questionId}. Registering on demand...`);
            bitIndex = await this.registerNewQuestion(questionId);
        }
        const key = this.studentKey(studentId);
        // GETBIT then SETBIT — two ops, but GETSET is not available for bits.
        // Acceptable because this runs per question attempt, not in a hot inner loop.
        const previousValue = await this.redis.getBit(key, bitIndex);
        const isFirstAttempt = previousValue === 0;
        if (isFirstAttempt) {
            await this.redis.setBit(key, bitIndex, 1);
        }
        return { isFirstAttempt, bitIndex };
    }
    /**
     * Mark multiple questions at once (e.g. when a full test is submitted).
     * Returns a map of questionId → isFirstAttempt.
     *
     * Uses a pipeline to batch all GETBIT + SETBIT calls in one round-trip.
     */
    async markAttemptedBatch(studentId, questionIds) {
        this.ensureLoaded();
        if (questionIds.length === 0)
            return new Map();
        const key = this.studentKey(studentId);
        const results = new Map();
        // Phase 1: GET all current bits in one pipeline
        const getPipeline = this.redis.multi();
        const indexedQuestions = [];
        for (const questionId of questionIds) {
            let bitIndex = this.questionToIndex.get(questionId);
            if (bitIndex === undefined) {
                console.warn(`[QuestionBitmapRegistry] Unknown questionId: ${questionId}. Registering on demand...`);
                bitIndex = await this.registerNewQuestion(questionId);
            }
            indexedQuestions.push({ questionId, bitIndex });
            getPipeline.getBit(key, bitIndex);
        }
        const currentBits = await getPipeline.exec();
        // Phase 2: SET bits only for first-time questions
        const setPipeline = this.redis.multi();
        let setCount = 0;
        indexedQuestions.forEach(({ questionId, bitIndex }, i) => {
            const currentBit = currentBits[i];
            const isFirstAttempt = currentBit === 0;
            results.set(questionId, { isFirstAttempt, bitIndex });
            if (isFirstAttempt) {
                setPipeline.setBit(key, bitIndex, 1);
                setCount++;
            }
        });
        if (setCount > 0) {
            await setPipeline.exec();
        }
        return results;
    }
    /**
     * Check if a student has ever seen a question — without marking it.
     * Fast path: Redis only.
     * Falls back to DB if the student's bitmap key doesn't exist yet (cold start).
     */
    async hasAttempted(studentId, questionId) {
        this.ensureLoaded();
        const bitIndex = this.questionToIndex.get(questionId);
        if (bitIndex === undefined)
            return false;
        const key = this.studentKey(studentId);
        // Check if key exists first (avoid false negative on missing key)
        const keyExists = await this.redis.exists(key);
        if (!keyExists) {
            // Cold start — check DB directly and warm cache
            return this.coldStartCheck(studentId, questionId);
        }
        const bit = await this.redis.getBit(key, bitIndex);
        return bit === 1;
    }
    /**
     * Get the total count of unique questions this student has attempted.
     * BITCOUNT is O(N) on the bitmap size — for 3000 questions that's 375 bytes, extremely fast.
     */
    async getUniqueAttemptCount(studentId) {
        this.ensureLoaded();
        return await this.redis.bitCount(this.studentKey(studentId));
    }
    /**
     * Get all questionIds this student has attempted (bitmap → questionId list).
     * Useful for analytics — e.g. "which chapters has this student covered?".
     */
    async getAttemptedQuestionIds(studentId) {
        this.ensureLoaded();
        const key = this.studentKey(studentId);
        const totalUnique = await this.redis.bitCount(key);
        if (totalUnique === 0)
            return { totalUnique: 0, questionIds: [] };
        // Read raw bitmap bytes and decode manually
        // Redis GETRANGE returns the raw string (bitmap bytes)
        const maxIndex = (await this.redis.get(this.COUNTER_KEY)) ?? "0";
        const maxByte = Math.ceil((parseInt(maxIndex, 10) + 1) / 8);
        const rawBitmap = await this.redis.getRange(key, 0, maxByte - 1);
        if (!rawBitmap)
            return { totalUnique, questionIds: [] };
        const questionIds = [];
        for (let byteIndex = 0; byteIndex < rawBitmap.length; byteIndex++) {
            const byte = rawBitmap.charCodeAt(byteIndex);
            if (byte === 0)
                continue; // skip empty bytes fast
            for (let bit = 0; bit < 8; bit++) {
                // Redis stores bits MSB first
                if (byte & (1 << (7 - bit))) {
                    const questionIndex = byteIndex * 8 + bit;
                    const questionId = this.indexToQuestion.get(questionIndex);
                    if (questionId)
                        questionIds.push(questionId);
                }
            }
        }
        return { totalUnique, questionIds };
    }
    // ── RECONCILIATION ───────────────────────────────────────────────────────────
    /**
     * Called by the RabbitMQ worker AFTER it successfully flushes a student's
     * data to Postgres. Rebuilds the student's seen-questions bitmap from DB
     * to ensure Redis is consistent with the source of truth.
     *
     * This also acts as recovery if Redis was restarted and lost bitmap data.
     */
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
        // Union of both sources
        const allIds = new Set([
            ...testAttempts.map((a) => a.questionId),
            ...chapterAttempts.map((a) => a.questionId),
        ]);
        if (allIds.size === 0)
            return;
        const key = this.studentKey(studentId);
        // Set bits for all known attempted questions
        const pipeline = this.redis.multi();
        for (const questionId of allIds) {
            const bitIndex = this.questionToIndex.get(questionId);
            if (bitIndex !== undefined) {
                pipeline.setBit(key, bitIndex, 1);
            }
        }
        await pipeline.exec();
        console.log(`[QuestionBitmapRegistry] Synced ${allIds.size} unique questions for student ${studentId}.`);
    }
    /**
     * Wipe a student's bitmap (e.g. for testing or account reset).
     */
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
    /**
     * Cold start: bitmap key doesn't exist for this student yet.
     * Check DB directly, then warm the cache for next time.
     */
    async coldStartCheck(studentId, questionId) {
        const [testAttempt, chapterAttempt] = await Promise.all([
            this.db.testQuestionAttemptStatus.findFirst({
                where: { studentId, questionId, isCorrect: true },
                select: { id: true },
            }),
            this.db.chapterWiseQuestionAttemptStatus.findFirst({
                where: { studentId, questionId, isCorrect: true },
                select: { id: true },
            }),
        ]);
        const seen = !!(testAttempt || chapterAttempt);
        if (seen) {
            // Warm the bitmap so future calls are fast
            const bitIndex = this.questionToIndex.get(questionId);
            if (bitIndex !== undefined) {
                await this.redis.setBit(this.studentKey(studentId), bitIndex, 1);
            }
        }
        return seen;
    }
}
// ─── Singleton Export ─────────────────────────────────────────────────────────
// Instantiate once, share across your app
exports.questionBitmapRegistry = new QuestionBitmapRegistry(redis_1.redisClient, database_1.database);
