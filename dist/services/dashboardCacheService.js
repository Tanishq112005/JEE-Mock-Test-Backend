"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardCacheService = void 0;
const caching_1 = require("../lib/caching");
const chapterWiseCacheService_1 = require("./chapterWiseCacheService");
class DashboardCacheService {
    constructor() { }
    // =================================================================
    // ANALYTICS — Test Data
    // =================================================================
    async reddisTestData(studentId) {
        try {
            const usersTestData = await caching_1.cacheService.getCache(`${studentId}:testUpperLayer`);
            if (!usersTestData || !usersTestData.testId?.length) {
                return { testData: [] };
            }
            const userTestReddis = await Promise.all(usersTestData.testId.map(async (entry) => {
                const testData = await caching_1.cacheService.getCache(`${studentId}:${entry.id}:${entry.created_at}`);
                return {
                    testId: entry.id,
                    created_at: entry.created_at,
                    testData,
                };
            }));
            return {
                testData: userTestReddis.filter((t) => t.testData != null),
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // =================================================================
    // ANALYTICS — Practice Wise Data
    // =================================================================
    async reddisPraticeWiseData(studentId) {
        try {
            const activeAttempts = await chapterWiseCacheService_1.chapterWiseCacheService.getAllActiveAttempts(studentId);
            const praticeWiseData = Object.entries(activeAttempts).flatMap(([questionId, attempts]) => attempts.map((attempt) => ({
                questionId,
                created_at: attempt.timestamp
                    ? new Date(attempt.timestamp)
                    : new Date(),
                questionData: {
                    ...attempt,
                    questionId: attempt.questionId ?? questionId,
                    marks: attempt.marks ?? attempt.marksObtained ?? 0,
                    positiveMarks: attempt.positiveMarks ?? 0,
                    timeSpent: attempt.timeSpent ?? 0,
                    type: attempt.type ?? attempt.questionType,
                    examName: attempt.examName ?? attempt.exam ?? null,
                    chapterId: attempt.chapterId ?? null,
                },
            })));
            return { praticeWiseData };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // =================================================================
    // UPDATE DATA — Read all update entries for a student
    // =================================================================
    async reddisTestUpdateData(studentId) {
        try {
            const userTestUpdateData = await caching_1.cacheService.getCache(`${studentId}:updateUpperLayer`);
            if (!userTestUpdateData || !userTestUpdateData.testId?.length) {
                return { updateData: [] };
            }
            const testUpdateData = await Promise.all(userTestUpdateData.testId.map(async (entry) => {
                const updateData = await caching_1.cacheService.getCache(`${studentId}:${entry.id}:${entry.created_at}:updateData`);
                return {
                    testId: entry.id,
                    created_at: entry.created_at,
                    updateData,
                };
            }));
            return {
                updateData: testUpdateData.filter((t) => t.updateData != null),
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    // =================================================================
    // UPDATE DATA — Get single test update entry
    // =================================================================
    async getTestUpdateDataFromReddis(studentId, testId, created_at) {
        try {
            const updateData = await caching_1.cacheService.getCache(`${studentId}:${testId}:${created_at}:updateData`);
            return updateData ?? null;
        }
        catch (err) {
            console.error("Redis getTestUpdateDataFromReddis failed:", err);
            return null;
        }
    }
    // =================================================================
    // UPDATE DATA — Upsert (always one entry per testId, no duplicates)
    // =================================================================
    async upsertTestUpdateData(studentId, testId, created_at, updateData) {
        try {
            // ── 1. Get current upper layer index ──────────────────────
            let upperLayer = await caching_1.cacheService.getCache(`${studentId}:updateUpperLayer`);
            if (!upperLayer) {
                upperLayer = { testId: [] };
            }
            // ── 2. Check if this testId already exists ────────────────
            const existingEntry = upperLayer.testId.find((entry) => entry.id === testId);
            if (existingEntry) {
                // Delete the stale data key with the OLD timestamp
                await caching_1.cacheService.deleteCache(`${studentId}:${testId}:${existingEntry.created_at}:updateData`);
                console.log(`Deleted stale Redis key for testId: ${testId} | old timestamp: ${existingEntry.created_at}`);
            }
            // ── 3. Remove old index entry ─────────────────────────────
            upperLayer.testId = upperLayer.testId.filter((entry) => entry.id !== testId);
            // ── 4. Push latest entry into index ───────────────────────
            upperLayer.testId.push({ id: testId, created_at });
            // ── 5. Persist both in parallel ───────────────────────────
            await Promise.all([
                caching_1.cacheService.setCache(`${studentId}:${testId}:${created_at}:updateData`, updateData),
                caching_1.cacheService.setCache(`${studentId}:updateUpperLayer`, upperLayer),
            ]);
            console.log(`Redis upserted updateData for testId: ${testId} | timestamp: ${created_at}`);
        }
        catch (err) {
            // ── Never let Redis failure break the main flow ───────────
            console.error("Redis upsertTestUpdateData failed:", err);
        }
    }
    // =================================================================
    // UPDATE DATA — Delete a test's update entry (call after DB confirms write)
    // =================================================================
    async deleteTestUpdateData(studentId, testId) {
        try {
            // ── 1. Get upper layer to find the timestamp ──────────────
            const upperLayer = await caching_1.cacheService.getCache(`${studentId}:updateUpperLayer`);
            if (!upperLayer || !upperLayer.testId?.length)
                return;
            const existingEntry = upperLayer.testId.find((entry) => entry.id === testId);
            if (!existingEntry) {
                console.log(`No Redis entry found to delete for testId: ${testId}`);
                return;
            }
            // ── 2. Delete the data key ────────────────────────────────
            await caching_1.cacheService.deleteCache(`${studentId}:${testId}:${existingEntry.created_at}:updateData`);
            // ── 3. Remove from index and persist ─────────────────────
            upperLayer.testId = upperLayer.testId.filter((entry) => entry.id !== testId);
            await caching_1.cacheService.setCache(`${studentId}:updateUpperLayer`, upperLayer);
            console.log(`Redis fully removed updateData for testId: ${testId}`);
        }
        catch (err) {
            console.error("Redis deleteTestUpdateData failed:", err);
        }
    }
}
exports.dashboardCacheService = new DashboardCacheService();
