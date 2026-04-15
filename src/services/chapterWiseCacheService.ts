import { cacheService } from "../lib/caching";

export interface CachedAttemptData {
  studentId?: string;
  questionId?: string;
  timeSpent: number;
  userAnswer: string[];
  status: string;
  isCorrect?: boolean;
  marksObtained?: number;
}

const TTL_SECONDS = 60 * 60 * 24; // 24 hours

class ChapterWiseCacheService {
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
    activeQuestions = activeQuestions.filter((id) => id !== questionId);
    await cacheService.setCache(setKey, activeQuestions);

    await cacheService.deleteCache(key);
  }

  public async getAllActiveAttempts(userId: string) {
    const setKey = this.getActiveQuestionsSetKey(userId);
    const activeQuestions: string[] = await cacheService.getCache(setKey) || [];

    const attempts: Record<string, CachedAttemptData> = {};
    for (const questionId of activeQuestions) {
      const key = this.getCacheKey(userId, questionId);
      const data = await cacheService.getCache(key);
      if (data) attempts[questionId] = data;
    }
    return attempts;
  }
}

export const chapterWiseCacheService = new ChapterWiseCacheService();
