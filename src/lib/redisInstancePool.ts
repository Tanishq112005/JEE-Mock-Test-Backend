// =================================================================
// lib/redisInstancePool.ts
// Simple single-instance Redis wrapper — no Management API needed
// =================================================================

import { Redis } from "@upstash/redis";

export interface RedisInstanceConfig {
    url:   string;
    token: string;
}

class RedisInstancePool {
    private redis: Redis;

    constructor(config: RedisInstanceConfig) {
        this.redis = new Redis({ url: config.url, token: config.token });
        console.log(`✅ Redis instance initialized`);
    }

    getInstance(): Redis {
        return this.redis;
    }
}

export { RedisInstancePool };