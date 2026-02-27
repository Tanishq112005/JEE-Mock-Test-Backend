"use strict";
// =================================================================
// lib/caching.ts
// Simple Redis caching layer — single instance, no pool rotation
// =================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.reddisConfigForCaching = void 0;
const redis_1 = require("@upstash/redis");
const env_1 = require("../config/env");
class ReddisConfigForCaching {
    analyticsRedis;
    testRedis;
    constructor() {
        this.analyticsRedis = new redis_1.Redis({
            url: env_1.ANALYTICS_REDIS_URL,
            token: env_1.ANALYTICS_REDIS_TOKEN,
        });
        this.testRedis = new redis_1.Redis({
            url: env_1.TEST_REDIS_URL,
            token: env_1.TEST_REDIS_TOKEN,
        });
        console.log("✅ Redis instances initialized (analytics + test)");
    }
    // =================================================================
    // ANALYTICS DATA
    // =================================================================
    async settingAnanlyticsData(key, data) {
        try {
            await this.analyticsRedis.set(key, JSON.stringify(data));
            console.log(`✅ Analytics SET — key: "${key}"`);
        }
        catch (err) {
            console.error(`❌ Analytics SET failed — key: "${key}":`, err.message);
            throw err;
        }
    }
    async gettingAnanlyticsData(key) {
        try {
            const raw = await this.analyticsRedis.get(key);
            if (!raw)
                return null;
            // ── Upstash may auto-deserialize JSON — handle both cases ──
            if (typeof raw === "string") {
                try {
                    return JSON.parse(raw);
                }
                catch {
                    return raw;
                }
            }
            return raw;
        }
        catch (err) {
            console.error(`❌ Analytics GET failed — key: "${key}":`, err.message);
            return null; // never crash the caller on a cache miss
        }
    }
    async deletingAnanlyticsData(key) {
        try {
            await this.analyticsRedis.del(key);
            console.log(`🗑️  Analytics DELETE — key: "${key}"`);
        }
        catch (err) {
            console.error(`❌ Analytics DELETE failed — key: "${key}":`, err.message);
        }
    }
    // =================================================================
    // TEST / UPDATE DATA
    // =================================================================
    async settingTestData(key, data) {
        try {
            await this.testRedis.set(key, JSON.stringify(data));
            console.log(`✅ Test data SET — key: "${key}"`);
        }
        catch (err) {
            console.error(`❌ Test data SET failed — key: "${key}":`, err.message);
            throw err;
        }
    }
    async gettingTestData(key) {
        try {
            const raw = await this.testRedis.get(key);
            if (!raw)
                return null;
            if (typeof raw === "string") {
                try {
                    return JSON.parse(raw);
                }
                catch {
                    return raw;
                }
            }
            return raw;
        }
        catch (err) {
            console.error(`❌ Test data GET failed — key: "${key}":`, err.message);
            return null; // never crash the caller on a cache miss
        }
    }
    async deletingTestData(key) {
        try {
            await this.testRedis.del(key);
            console.log(`🗑️  Test data DELETE — key: "${key}"`);
        }
        catch (err) {
            console.error(`❌ Test data DELETE failed — key: "${key}":`, err.message);
        }
    }
}
exports.reddisConfigForCaching = new ReddisConfigForCaching();
