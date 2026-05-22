import redisManager from "../lib/redisManager";
import { database } from "../lib/database";
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";

export interface StreakStatus {
  currentStreak: number;
  maxStreak: number;
  questionsToday: number;
  lastActiveDate: string;
}

class StreakCacheService {
  private readonly STREAK_PREFIX = "streak:";
  
  private getTodayStr(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }

  private getYesterdayStr(): string {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - 1);
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }

  private async hydrateFromDB(studentId: string): Promise<StreakStatus> {
    const profile = await database.studentProfile.findUnique({
      where: { id: studentId },
      select: { streak: true, maximumStreak: true }
    });

    if (!profile) {
      throw new Error(`Profile not found for student ${studentId}`);
    }

    const todayStr = this.getTodayStr();
    const todayUTC = new Date(todayStr);

    const todayLog = await database.dailyActivityLog.findUnique({
      where: { studentId_date: { studentId, date: todayUTC } }
    });

    let lastActiveDate = "";
    let questionsToday = 0;

    if (todayLog) {
      lastActiveDate = todayStr;
      questionsToday = todayLog.questionsSolved;
    } else {
      // Check yesterday to see if we should preserve the current streak
      const yesterdayStr = this.getYesterdayStr();
      const yesterdayUTC = new Date(yesterdayStr);
      const yesterdayLog = await database.dailyActivityLog.findUnique({
        where: { studentId_date: { studentId, date: yesterdayUTC } }
      });

      if (yesterdayLog) {
        lastActiveDate = yesterdayStr;
      } else {
        // They missed yesterday AND today, so DB streak is broken
        if (profile.streak > 0) {
           // We will fix the DB lazily
           this.fireResetEvent(studentId);
        }
      }
    }

    const status: StreakStatus = {
      currentStreak: profile.streak,
      maxStreak: profile.maximumStreak,
      questionsToday,
      lastActiveDate
    };

    // Save to Redis
    const key = `${this.STREAK_PREFIX}${studentId}`;
    const redisClient = redisManager.getDashboardRedis(studentId);
    await redisClient.hSet(key, {
      currentStreak: status.currentStreak.toString(),
      maxStreak: status.maxStreak.toString(),
      questionsToday: status.questionsToday.toString(),
      lastActiveDate: status.lastActiveDate
    });
    // Expire after 2 days to keep Redis clean, it will rehydrate if needed
    await redisClient.expire(key, 2 * 24 * 60 * 60);

    return status;
  }

  public async getStreakStatus(studentId: string): Promise<StreakStatus> {
    const key = `${this.STREAK_PREFIX}${studentId}`;
    const redisClient = redisManager.getDashboardRedis(studentId);
    const exists = await redisClient.exists(key);

    if (!exists) {
      return this.hydrateFromDB(studentId);
    }

    const data = await redisClient.hGetAll(key);
    
    // Check if a new day has started
    const todayStr = this.getTodayStr();
    const yesterdayStr = this.getYesterdayStr();
    
    let currentStreak = parseInt(data.currentStreak || "0", 10);
    const maxStreak = parseInt(data.maxStreak || "0", 10);
    let questionsToday = parseInt(data.questionsToday || "0", 10);
    let lastActiveDate = data.lastActiveDate || "";

    if (lastActiveDate !== todayStr) {
      questionsToday = 0; // Reset for the new day
      if (lastActiveDate !== yesterdayStr) {
        // If they missed yesterday, streak is broken
        if (currentStreak > 0) {
          currentStreak = 0;
          this.fireResetEvent(studentId);
        }
      }
      
      // Update Redis to reflect the start of a new day for this user
      await redisClient.hSet(key, {
        currentStreak: currentStreak.toString(),
        questionsToday: "0",
        lastActiveDate: lastActiveDate // don't change lastActiveDate until they solve a question
      });
    }

    return {
      currentStreak,
      maxStreak,
      questionsToday,
      lastActiveDate
    };
  }

  private fireResetEvent(studentId: string) {
    try {
      rabbitMQClient.getChannel().then(channel => {
        const exchange = "main_exchange";
        const routingKey = "streak.reset";
        channel.assertExchange(exchange, "direct", { durable: true });
        channel.publish(
          exchange,
          routingKey,
          Buffer.from(JSON.stringify({ studentId })),
          { persistent: true }
        );
      });
    } catch (err) {
      console.error("Failed to publish streak reset to RabbitMQ", err);
    }
  }

  private fireUpdateEvent(studentId: string, currentStreak: number, maxStreak: number) {
    try {
      rabbitMQClient.getChannel().then(channel => {
        const exchange = "main_exchange";
        const routingKey = "streak.update";
        channel.assertExchange(exchange, "direct", { durable: true });
        channel.publish(
          exchange,
          routingKey,
          Buffer.from(JSON.stringify({ studentId, currentStreak, maxStreak })),
          { persistent: true }
        );
      });
    } catch (err) {
      console.error("Failed to publish streak update to RabbitMQ", err);
    }
  }

  public async incrementActivity(studentId: string, count: number = 1): Promise<void> {
    const key = `${this.STREAK_PREFIX}${studentId}`;
    const redisClient = redisManager.getDashboardRedis(studentId);
    const exists = await redisClient.exists(key);

    if (!exists) {
      await this.hydrateFromDB(studentId);
    }

    const data = await redisClient.hGetAll(key);
    const todayStr = this.getTodayStr();
    const yesterdayStr = this.getYesterdayStr();
    
    let currentStreak = parseInt(data.currentStreak || "0", 10);
    let maxStreak = parseInt(data.maxStreak || "0", 10);
    let questionsToday = parseInt(data.questionsToday || "0", 10);
    const lastActiveDate = data.lastActiveDate || "";

    if (lastActiveDate === todayStr) {
      // Already active today, just increment questions
      questionsToday += count;
      await redisClient.hIncrBy(key, "questionsToday", count);
    } else {
      // First question(s) of the day!
      questionsToday = count;
      
      if (lastActiveDate === yesterdayStr) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }

      await redisClient.hSet(key, {
        currentStreak: currentStreak.toString(),
        maxStreak: maxStreak.toString(),
        questionsToday: questionsToday.toString(),
        lastActiveDate: todayStr
      });
      
      // Fire RabbitMQ event to sync this to DB asynchronously
      this.fireUpdateEvent(studentId, currentStreak, maxStreak);
    }
  }
}

export const streakCacheService = new StreakCacheService();
