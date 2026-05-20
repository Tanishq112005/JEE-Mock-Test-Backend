"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBucket = void 0;
const env_1 = require("../../config/env");
const redisManager_1 = __importDefault(require("../../lib/redisManager"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
class TokenBucket {
    capacity;
    refillRate;
    // Accept optional custom parameters
    constructor(customCapacity, customRefillRate) {
        this.capacity = customCapacity ?? parseInt(env_1.TOKEN_BUCKET_CAPACITY || "10", 10);
        this.refillRate = customRefillRate ?? parseInt(env_1.TOKEN_BUCKET_REFLIER || "1", 10);
    }
    limit = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.ip;
            const redisClient = redisManager_1.default.getAuthRedis(userId);
            // Add a prefix based on capacity/rate so different routes don't share the exact same bucket
            const key = `ratelimit:tb:${this.capacity}:${userId}`;
            const now = Math.floor(Date.now() / 1000);
            const script = `
                local bucket = redis.call("HMGET", KEYS[1], "tokens", "lastRefillTime")
                local capacity = tonumber(ARGV[1])
                local refillRate = tonumber(ARGV[2])
                local now = tonumber(ARGV[3])
                
                local tokens = tonumber(bucket[1] or capacity)
                local lastRefillTime = tonumber(bucket[2] or now)
                
                local timePassed = math.max(0, now - lastRefillTime)
                local tokensToAdd = timePassed * refillRate
                
                tokens = math.min(capacity, tokens + tokensToAdd)
                
                if tokens >= 1 then
                    redis.call("HMSET", KEYS[1], "tokens", tokens - 1, "lastRefillTime", now)
                    redis.call("EXPIRE", KEYS[1], 3600)
                    return 1
                else
                    return 0
                end
            `;
            // Using the correct syntax for your redis v4+ library
            const result = await redisClient.eval(script, {
                keys: [key],
                arguments: [
                    this.capacity.toString(),
                    this.refillRate.toString(),
                    now.toString()
                ]
            });
            const statusCode = typeof result === 'number' ? result : 0;
            if (statusCode === 0) {
                return res.status(429).json(new ApiError_1.default("Too many requests. Please wait.", 429));
            }
            next();
        }
        catch (err) {
            console.error("Rate Limit Error In Token Bucket", err);
            next();
        }
    };
}
exports.TokenBucket = TokenBucket;
