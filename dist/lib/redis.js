"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionRedisclient = exports.questionBitMapRedisclient = exports.redisConfig = exports.REDIS_CACHE_EXPIRATION = void 0;
const env_1 = require("../config/env");
const redis_1 = require("redis");
exports.REDIS_CACHE_EXPIRATION = env_1.REDIS_CACHE_EXPIRATION_SECONDS ? parseInt(env_1.REDIS_CACHE_EXPIRATION_SECONDS, 10) : 86400 * 7;
class RedisConfig {
    questionBitMapclient;
    questionsClient;
    constructor() {
        const questionBitMapclientPort = parseInt(env_1.REDIS_PORT, 10) || 6379;
        this.questionBitMapclient = (0, redis_1.createClient)({
            username: env_1.REDIS_USERNAME,
            password: env_1.REDIS_PASSWORD,
            socket: {
                host: env_1.REDIS_HOST,
                port: questionBitMapclientPort
            },
        });
        this.questionsClient = (0, redis_1.createClient)({
            url: env_1.QUESTION_STORE_REDIS_URL
        });
        this.questionBitMapclient.on("error", (err) => console.log("Questions Bit Map Redis Client Error:", err));
        this.questionBitMapclient.on("connect", () => console.log("Questions Bit Map Redis Connected Successfully"));
        this.questionsClient.on("error", (err) => console.log("Questions Redis Client Error:", err));
        this.questionsClient.on("connect", () => console.log("Questions Redis Connected"));
        this.connect();
    }
    async connect() {
        try {
            await this.questionBitMapclient.connect();
            await this.questionsClient.connect();
        }
        catch (error) {
            console.error("Failed to connect to Redis:", error);
        }
    }
    // functions for the redis auth and all 
    getRedisEmailKey(email) {
        return `OTP:${email}`;
    }
    getRedisLimitKey(keyPrefix, identifier) {
        return `rate_limit:${keyPrefix}:${identifier}`;
    }
    // functions for the questions loader in the redis 
    getRedisChapterDataUsingChapterName(chapterName) {
        return `ChapterDataUsingChapterName:${chapterName}`;
    }
    getRedisChapterDataUsingChapterId(id) {
        return `ChapterDataUsingChapterId:${id}`;
    }
    getRedisGroupName(subjectName) {
        return `GroupName:${subjectName}`;
    }
    getRedisChaptersByGroup(groupName) {
        return `ChaptersByGroup:${groupName}`;
    }
    getRedisPaperData(paperId) {
        return `PaperData:${paperId}`;
    }
}
exports.redisConfig = new RedisConfig();
exports.questionBitMapRedisclient = exports.redisConfig.questionBitMapclient;
exports.questionRedisclient = exports.redisConfig.questionsClient;
