import { cacheService } from "../lib/caching";

export interface CachedAttemptData {
  timeSpent: number;
  userAnswer: string[];
  status: string;
  isCorrect?: boolean;
  marksObtained?: number;
}

class ChapterWiseCacheService {
  constructor() {}

  private getCacheKey(userId: string, questionId: string) {
    return `${userId}:chapterWise:attempt:${questionId}`;
  }

  private getActiveQuestionsSetKey(userId: string) {
    return `${userId}:chapterWise:activeQuestions`;
  }

  public async upsertAttemptData(
    userId: string,
    questionId: string,
    data: CachedAttemptData,
  ) {
    const key = this.getCacheKey(userId, questionId);
    const setKey = this.getActiveQuestionsSetKey(userId);

    const client = cacheService['getClientForKey'] ? (cacheService as any).getClientForKey(key) : null;
    
    // Fallback if caching.ts abstracts it differently: we will just use cacheService.setCache
    // But since caching.ts hides the redis client, we can simulate the SET by storing an array or using the raw client if accessible.
    // Let's store an upper layer array similar to test updates
    let activeQuestions: string[] = await cacheService.getCache(setKey) || [];
    
    if (!activeQuestions.includes(questionId)) {
      activeQuestions.push(questionId);
      await cacheService.setCache(setKey, activeQuestions);
    }

    await cacheService.setCache(key, data);
  }

  public async getAttemptData(userId: string, questionId: string) {
    const key = this.getCacheKey(userId, questionId);
    return await cacheService.getCache(key);
  }

  public async deleteAttemptData(userId: string, questionId: string) {
    const key = this.getCacheKey(userId, questionId);
    const setKey = this.getActiveQuestionsSetKey(userId);

    let activeQuestions: string[] = await cacheService.getCache(setKey) || [];
    if (activeQuestions.includes(questionId)) {
      activeQuestions = activeQuestions.filter((id) => id !== questionId);
      await cacheService.setCache(setKey, activeQuestions);
    }

    await cacheService.deleteCache(key);
  }

  public async getAllActiveAttempts(userId: string) {
    const setKey = this.getActiveQuestionsSetKey(userId);
    const activeQuestions: string[] = await cacheService.getCache(setKey) || [];
    
    const attempts: Record<string, CachedAttemptData> = {};
    for (const questionId of activeQuestions) {
       const key = this.getCacheKey(userId, questionId);
       const data = await cacheService.getCache(key);
       if (data) {
          attempts[questionId] = data;
       }
    }
    return attempts;
  }
}

export const chapterWiseCacheService = new ChapterWiseCacheService();
