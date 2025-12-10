import ApiError from "../utils/ApiError";
import { redisClient, redisConfig } from "../lib/redis";

export class RateLimiter {
    private redis: any;
    private maxAttempts: number;
    private windowSize: number;
    private keyPrefix: string;

    constructor(redis: any, max_attempts: number, window_size: number, keyPrefix: string) {
        this.redis = redisClient;
        this.maxAttempts = max_attempts;
        this.windowSize = window_size;
        this.keyPrefix = keyPrefix;
    }

    limit = async (req: any, res: any, next: any) => {
        try {
            const identifier = req.body.email || req.body.phoneNumber || req.ip;

            if (!identifier) {
                return next(new ApiError("Missing identifier for rate limiting", 400));
            }

            const key = redisConfig.getRedisLimitKey(this.keyPrefix, identifier);
            const currentTime = Date.now();
            const windowStart = currentTime - (this.windowSize * 1000);

            const multi = this.redis.multi();

            multi.zRemRangeByScore(key, 0, windowStart);

            multi.zCard(key);

            multi.zAdd(key, { score: currentTime, value: currentTime.toString() });

            multi.expire(key, this.windowSize + 1);

            const results = await multi.exec();

            const requestCount = results ? (results[1] as number) : 0;

            if (requestCount > this.maxAttempts) {
                return res.status(429).json(
                    new ApiError(
                        `Too many requests. Please try again in ${this.windowSize} seconds.`,
                        429
                    )
                );
            }

            next();

        } catch (error) {
            console.error("Rate Limiter Error:", error);
            next();
        }
    }
}