"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reddisConfigForCaching = void 0;
const redis_1 = require("@upstash/redis");
const env_1 = require("../config/env");
class ReddisConfigForCaching {
    reddisAnalytics;
    reddisTestData;
    constructor() {
        this.reddisAnalytics = new redis_1.Redis({
            url: env_1.UPSTASH_REDIS_REST_URL,
            token: env_1.UPSTASH_REDIS_REST_URL,
        });
        this.reddisTestData = new redis_1.Redis({
            url: env_1.UPSTASH_REDIS_REST_URL_CACHING,
            token: env_1.UPSTASH_REDIS_REST_TOKEN_CACHING
        });
    }
    async settingAnanlyticsData(key, data) {
        try {
            await this.reddisAnalytics.set(key, data);
        }
        catch (err) {
            throw err;
        }
    }
    async gettingAnanlyticsData(key) {
        try {
            const data = await this.reddisAnalytics.get(key);
            return data;
        }
        catch (err) {
            throw err;
        }
    }
    async deletingAnanlyticsData(key) {
        try {
            await this.reddisAnalytics.del(key);
        }
        catch (err) {
            throw err;
        }
    }
    async settingTestData(key, data) {
        try {
            await this.reddisTestData.set(key, data);
        }
        catch (err) {
            throw err;
        }
    }
    async gettingTestData(key) {
        try {
            const data = await this.reddisTestData.get(key);
            return data;
        }
        catch (err) {
            throw err;
        }
    }
    async deletingTestData(key) {
        try {
            await this.reddisTestData.del(key);
        }
        catch (err) {
            throw err;
        }
    }
}
exports.reddisConfigForCaching = new ReddisConfigForCaching();
