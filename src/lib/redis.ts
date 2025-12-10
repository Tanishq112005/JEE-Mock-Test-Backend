import { REDIS_HOST, REDIS_PORT } from "../config/env";
import Redis from "ioredis";

class RedisConfig {
    public client: Redis;

    constructor() {
        // FIX: Ensure it is a string ('as string') or handle fallback safely
        const redisPort = REDIS_PORT ? parseInt(REDIS_PORT as string, 10) : 6379;

        this.client = new Redis({
            port: redisPort,
            host: REDIS_HOST || 'localhost',
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        this.client.on('error', (err) => {
            console.error('Redis Connection Error:', err);
        });

        this.client.on('connect', () => {
            console.log('Redis Connected Successfully');
        });
    }

    getRedisEmailKey(email: string) {
        return `OTP:${email}`;
    }

    getRedisLimitKey(keyPrefix: string, identifier: string) {
        return `rate_limit:${keyPrefix}:${identifier}`;
    }
}

export const redisConfig = new RedisConfig();
export const redisClient = redisConfig.client;