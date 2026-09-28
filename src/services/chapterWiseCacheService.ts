import { cacheService } from "../lib/caching";
import redisManager from "../lib/redisManager";

export interface CachedAttemptData {
  studentId?: string;
  questionId?: string;
  timeSpent: number;
  userAnswer: string[];
  status: string;
  isCorrect?: boolean;
  marksObtained?: number;
  marks?: number;
  positiveMarks?: number;
  negativeMarks?: number;
  verdict?: string;
  type?: string;
  questionType?: string;
  subjectId?: string;
  chapterId?: string | null;
  examName?: string | null;
  exam?: string | null;
  timestamp?: number;
}

const TTL_SECONDS = 60 * 60 * 24;

class ChapterWiseCacheService {
  private getCacheKey(userId: string, questionId: string) {
    return `${userId}:chapterWise:attempt:${questionId}`;
  }

  private getActiveQuestionsSetKey(userId: string) {
    return `${userId}:chapterWise:activeQuestionsSet`;
  }

  public async upsertAttemptData(
    userId: string,
    questionId: string,
    data: CachedAttemptData,
  ) {
    const key = this.getCacheKey(userId, questionId);
    const setKey = this.getActiveQuestionsSetKey(userId);

    const client = redisManager.getDashboardRedis(userId);
    await client.sAdd(setKey, questionId);

    let attemptsArray: CachedAttemptData[] = (await cacheService.getCache(key)) || [];
    
    attemptsArray.push({ ...data, timestamp: Date.now() });

    await cacheService.setCache(key, attemptsArray);
  }

  public async getAttemptData(userId: string, questionId: string): Promise<CachedAttemptData[]> {
    const key = this.getCacheKey(userId, questionId);
    return (await cacheService.getCache(key)) || [];
  }

  public async deleteAttemptData(userId: string, questionId: string) {
    const key = this.getCacheKey(userId, questionId);
    const setKey = this.getActiveQuestionsSetKey(userId);

    const client = redisManager.getDashboardRedis(userId);
    await client.sRem(setKey, questionId);

    await cacheService.deleteCache(key);
  }

  public async getAllActiveAttempts(userId: string) {
    const setKey = this.getActiveQuestionsSetKey(userId);
    
    const client = redisManager.getDashboardRedis(userId);
    const activeQuestions: string[] = (await client.sMembers(setKey)) || [];

    const attempts: Record<string, CachedAttemptData[]> = {};
    for (const questionId of activeQuestions) {
      const key = this.getCacheKey(userId, questionId);
      const data = await cacheService.getCache(key);
      if (data) attempts[questionId] = data;
    }
    return attempts;
  }
}

export const chapterWiseCacheService = new ChapterWiseCacheService();
