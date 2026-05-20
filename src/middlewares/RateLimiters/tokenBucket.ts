import { TOKEN_BUCKET_CAPACITY, TOKEN_BUCKET_REFLIER } from "../../config/env";
import redisManager from "../../lib/redisManager";
import ApiError from "../../utils/ApiError";


export class TokenBucket {
    private capacity: number;
    private refillRate: number;
    private place : string ; 
    // Accept optional custom parameters
    constructor(place : string ,  customCapacity?: number, customRefillRate?: number  ) {
        this.capacity = customCapacity ?? parseInt(TOKEN_BUCKET_CAPACITY || "10", 10);
        this.refillRate = customRefillRate ?? parseInt(TOKEN_BUCKET_REFLIER || "1", 10);
        this.place = place ; 
    }

    limit = async (req: any, res: any, next: any) => {
        try {
            const userId = req.user?.id || req.ip;
            const redisClient = redisManager.getAuthRedis(userId);
            
            // Add a prefix based on capacity/rate so different routes don't share the exact same bucket
            const key = `ratelimit:tb:${this.capacity}:${userId}:${this.place}`;
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
                return res.status(429).json(new ApiError("Too many requests. Please wait.", 429));
            }

            next();
        } catch (err: any) {
            console.error("Rate Limit Error In Token Bucket", err);
            next();
        }
    };
}