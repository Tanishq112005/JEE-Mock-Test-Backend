"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const redis_1 = require("../lib/redis");
class RateLimiter {
    redis;
    maxAttempts;
    windowSize;
    keyPrefix;
    constructor(redis, max_attempts, window_size, keyPrefix) {
        this.redis = redis_1.redisClient;
        this.maxAttempts = max_attempts;
        this.windowSize = window_size;
        this.keyPrefix = keyPrefix;
    }
    limit = async (req, res, next) => {
        try {
            const identifier = req.body.email || req.body.phoneNumber || req.ip;
            if (!identifier) {
                return next(new ApiError_1.default("Missing identifier for rate limiting", 400));
            }
            const key = redis_1.redisConfig.getRedisLimitKey(this.keyPrefix, identifier);
            const currentTime = Date.now();
            const windowStart = currentTime - (this.windowSize * 1000);
            const multi = this.redis.multi();
            multi.zRemRangeByScore(key, 0, windowStart);
            multi.zCard(key);
            multi.zAdd(key, { score: currentTime, value: currentTime.toString() });
            multi.expire(key, this.windowSize + 1);
            const results = await multi.exec();
            const requestCount = results ? results[1] : 0;
            if (requestCount > this.maxAttempts) {
                return res.status(429).json(new ApiError_1.default(`Too many requests. Please try again in ${this.windowSize} seconds.`, 429));
            }
            next();
        }
        catch (error) {
            console.error("Rate Limiter Error:", error);
            next();
        }
    };
}
exports.RateLimiter = RateLimiter;
