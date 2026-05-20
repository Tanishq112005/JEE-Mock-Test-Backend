import ApiError from "../../utils/ApiError";
import { redisConfig } from "../../lib/redis";
import redisManager from "../../lib/redisManager"; // Import our new singleton

export class SlidingWindowLog {
  private maxAttempts: number;
  private windowSize: number;
  private keyPrefix: string;

  // Constructor se 'redis' hata diya gaya hai
  constructor(max_attempts: number, window_size: number, keyPrefix: string) {
    this.maxAttempts = max_attempts;
    this.windowSize = window_size;
    this.keyPrefix = keyPrefix;
  }

  limit = async (req: any, res: any, next: any) => {
    try {
      // 1. Identifier nikalo (email, phone, ya IP)
      const identifier = req.body.email || req.body.phoneNumber || req.ip;

      if (!identifier) {
        return next(new ApiError("Missing identifier for rate limiting", 400));
      }

      // 2. MAGIC STEP: Is specific identifier ke liye sahi Redis server dhundo
      const redisClient = redisManager.getAuthRedis(identifier);

      const key = redisConfig.getRedisLimitKey(this.keyPrefix, identifier);
      const currentTime = Date.now();
      const windowStart = currentTime - this.windowSize * 1000;

      // 3. Dynamic client ka multi() use karo
      const multi = redisClient.multi();

      multi.zRemRangeByScore(key, 0, windowStart);
      multi.zCard(key);
      multi.zAdd(key, { score: currentTime, value: currentTime.toString() });
      multi.expire(key, this.windowSize + 1);

      const results: any = await multi.exec();

      const requestCount = results ? (results[1] as number) : 0;

      if (requestCount > this.maxAttempts) {
        return res
          .status(429)
          .json(
            new ApiError(
              `Too many requests. Please try again in ${this.windowSize} seconds.`,
              429,
            ),
          );
      }

      next();
    } catch (error) {
      console.error("Rate Limiter Error:", error);
      // Agar Redis fail ho jaye, toh hum request ko block nahi karte, aage badhne dete hain
      next();
    }
  };
}
