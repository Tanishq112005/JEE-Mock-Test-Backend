"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterWiseCacheService = void 0;
const caching_1 = require("../lib/caching");
const TTL_SECONDS = 60 * 60 * 24; // 24 hours
class ChapterWiseCacheService {
    getCacheKey(userId, questionId) {
        return `${userId}:chapterWise:attempt:${questionId}`;
    }
    getActiveQuestionsSetKey(userId) {
        return `${userId}:chapterWise:activeQuestions`;
    }
    async upsertAttemptData(userId, questionId, data) {
        const key = this.getCacheKey(userId, questionId);
        const setKey = this.getActiveQuestionsSetKey(userId);
        let activeQuestions = (await caching_1.cacheService.getCache(setKey)) || [];
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
        let activeQuestions = (await caching_1.cacheService.getCache(setKey)) || [];
        activeQuestions = activeQuestions.filter((id) => id !== questionId);
        await caching_1.cacheService.setCache(setKey, activeQuestions);
        await caching_1.cacheService.deleteCache(key);
    }
    async getAllActiveAttempts(userId) {
        const setKey = this.getActiveQuestionsSetKey(userId);
        const activeQuestions = (await caching_1.cacheService.getCache(setKey)) || [];
        const attempts = {};
        for (const questionId of activeQuestions) {
            const key = this.getCacheKey(userId, questionId);
            const data = await caching_1.cacheService.getCache(key);
            if (data)
                attempts[questionId] = data;
        }
        return attempts;
    }
}
exports.chapterWiseCacheService = new ChapterWiseCacheService();
