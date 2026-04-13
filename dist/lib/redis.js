"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.redisConfig = void 0;
const env_1 = require("../config/env");
const redis_1 = require("redis");
class RedisConfig {
    client;
    constructor() {
        const port = parseInt(env_1.REDIS_PORT, 10) || 6379;
        this.client = (0, redis_1.createClient)({
            username: env_1.REDIS_USERNAME,
            password: env_1.REDIS_PASSWORD,
            socket: {
                host: env_1.REDIS_HOST,
                port: port,
            },
        });
        this.client.on("error", (err) => console.log("Redis Client Error:", err));
        this.client.on("connect", () => console.log("Redis Connected Successfully"));
        this.connect();
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            console.error("Failed to connect to Redis:", error);
        }
    }
    getRedisEmailKey(email) {
        return `OTP:${email}`;
    }
    getRedisLimitKey(keyPrefix, identifier) {
        return `rate_limit:${keyPrefix}:${identifier}`;
    }
}
exports.redisConfig = new RedisConfig();
exports.redisClient = exports.redisConfig.client;
