"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterWiseCacheService = void 0;
const caching_1 = require("../lib/caching");
class ChapterWiseCacheService {
    constructor() { }
    getCacheKey(userId, questionId) {
        return `${userId}:chapterWise:attempt:${questionId}`;
    }
    getActiveQuestionsSetKey(userId) {
        return `${userId}:chapterWise:activeQuestions`;
    }
    async upsertAttemptData(userId, questionId, data) {
        const key = this.getCacheKey(userId, questionId);
        const setKey = this.getActiveQuestionsSetKey(userId);
        const client = caching_1.cacheService['getClientForKey'] ? caching_1.cacheService.getClientForKey(key) : null;
        // Fallback if caching.ts abstracts it differently: we will just use cacheService.setCache
        // But since caching.ts hides the redis client, we can simulate the SET by storing an array or using the raw client if accessible.
        // Let's store an upper layer array similar to test updates
        let activeQuestions = await caching_1.cacheService.getCache(setKey) || [];
        if (!activeQuestions.includes(questionId)) {
            activeQuestions.push(questionId);
            await caching_1.cacheService.setCache(setKey, activeQuestions);
        }
        await caching_1.cacheService.setCache(key, data);
    }
    async getAttemptData(userId, questionId) {
        const key = this.getCacheKey(userId, questionId);
        return await caching_1.cacheService.getCache(key);
    }
    async deleteAttemptData(userId, questionId) {
        const key = this.getCacheKey(userId, questionId);
        const setKey = this.getActiveQuestionsSetKey(userId);
        let activeQuestions = await caching_1.cacheService.getCache(setKey) || [];
        if (activeQuestions.includes(questionId)) {
            activeQuestions = activeQuestions.filter((id) => id !== questionId);
            await caching_1.cacheService.setCache(setKey, activeQuestions);
        }
        await caching_1.cacheService.deleteCache(key);
    }
    async getAllActiveAttempts(userId) {
        const setKey = this.getActiveQuestionsSetKey(userId);
        const activeQuestions = await caching_1.cacheService.getCache(setKey) || [];
        const attempts = {};
        for (const questionId of activeQuestions) {
            const key = this.getCacheKey(userId, questionId);
            const data = await caching_1.cacheService.getCache(key);
            if (data) {
                attempts[questionId] = data;
            }
        }
        return attempts;
    }
}
exports.chapterWiseCacheService = new ChapterWiseCacheService();
