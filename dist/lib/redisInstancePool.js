"use strict";
// =================================================================
// lib/redisInstancePool.ts
// Simple single-instance Redis wrapper — no Management API needed
// =================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisInstancePool = void 0;
const redis_1 = require("@upstash/redis");
class RedisInstancePool {
    redis;
    constructor(config) {
        this.redis = new redis_1.Redis({ url: config.url, token: config.token });
        console.log(`✅ Redis instance initialized`);
    }
    getInstance() {
        return this.redis;
    }
}
exports.RedisInstancePool = RedisInstancePool;
