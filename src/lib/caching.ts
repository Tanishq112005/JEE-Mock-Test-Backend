// =================================================================
// lib/caching.ts
// Simple Redis caching layer — single instance, no pool rotation
// =================================================================

import { Redis } from "@upstash/redis";
import {
    ANALYTICS_REDIS_URL,
    ANALYTICS_REDIS_TOKEN,
    TEST_REDIS_URL,
    TEST_REDIS_TOKEN,
} from "../config/env";

class ReddisConfigForCaching {
    private analyticsRedis: Redis;
    private testRedis:      Redis;

    constructor() {
        this.analyticsRedis = new Redis({
            url:   ANALYTICS_REDIS_URL,
            token: ANALYTICS_REDIS_TOKEN,
        });

        this.testRedis = new Redis({
            url:   TEST_REDIS_URL,
            token: TEST_REDIS_TOKEN,
        });

        console.log("✅ Redis instances initialized (analytics + test)");
    }

    // =================================================================
    // ANALYTICS DATA
    // =================================================================

    async settingAnanlyticsData(key: string, data: any): Promise<void> {
        try {
            await this.analyticsRedis.set(key, JSON.stringify(data));
            console.log(`✅ Analytics SET — key: "${key}"`);
        } catch (err: any) {
            console.error(`❌ Analytics SET failed — key: "${key}":`, err.message);
            throw err;
        }
    }

    async gettingAnanlyticsData(key: string): Promise<any> {
        try {
            const raw = await this.analyticsRedis.get<string>(key);
            if (!raw) return null;

            // ── Upstash may auto-deserialize JSON — handle both cases ──
            if (typeof raw === "string") {
                try { return JSON.parse(raw); } catch { return raw; }
            }
            return raw;
        } catch (err: any) {
            console.error(`❌ Analytics GET failed — key: "${key}":`, err.message);
            return null;   // never crash the caller on a cache miss
        }
    }

    async deletingAnanlyticsData(key: string): Promise<void> {
        try {
            await this.analyticsRedis.del(key);
            console.log(`🗑️  Analytics DELETE — key: "${key}"`);
        } catch (err: any) {
            console.error(`❌ Analytics DELETE failed — key: "${key}":`, err.message);
        }
    }

    // =================================================================
    // TEST / UPDATE DATA
    // =================================================================

    async settingTestData(key: string, data: any): Promise<void> {
        try {
            await this.testRedis.set(key, JSON.stringify(data));
            console.log(`✅ Test data SET — key: "${key}"`);
        } catch (err: any) {
            console.error(`❌ Test data SET failed — key: "${key}":`, err.message);
            throw err;
        }
    }

    async gettingTestData(key: string): Promise<any> {
        try {
            const raw = await this.testRedis.get<string>(key);
            if (!raw) return null;

            if (typeof raw === "string") {
                try { return JSON.parse(raw); } catch { return raw; }
            }
            return raw;
        } catch (err: any) {
            console.error(`❌ Test data GET failed — key: "${key}":`, err.message);
            return null;   // never crash the caller on a cache miss
        }
    }

    async deletingTestData(key: string): Promise<void> {
        try {
            await this.testRedis.del(key);
            console.log(`🗑️  Test data DELETE — key: "${key}"`);
        } catch (err: any) {
            console.error(`❌ Test data DELETE failed — key: "${key}":`, err.message);
        }
    }
}

export const reddisConfigForCaching = new ReddisConfigForCaching();