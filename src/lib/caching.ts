// =================================================================
// lib/caching.ts
// Main Redis caching layer — uses instance pools for both
// analytics data and test/update data
// =================================================================

import { ANALYTICS_REDIS_INSTANCES, TEST_REDIS_INSTANCES } from "../config/env";
import { RedisInstancePool } from "./redisInstancePool";

class ReddisConfigForCaching {
    private analyticsPool: RedisInstancePool;
    private testDataPool:  RedisInstancePool;

    // ── Suffix used to store which instance holds each key ───────────
    // e.g. "userId:testUpperLayer:_instance" = "analytics_instance_2"
    private readonly metaSuffix = ":_instance";

    constructor() {
        this.analyticsPool = new RedisInstancePool(ANALYTICS_REDIS_INSTANCES);
        this.testDataPool  = new RedisInstancePool(TEST_REDIS_INSTANCES);
    }

    // =================================================================
    // ANALYTICS DATA
    // =================================================================

    async settingAnanlyticsData(key: any, data: any): Promise<void> {
        try {
            const { redis, instanceId } = await this.analyticsPool.getInstanceWithId();

            await Promise.all([
                // ── Store actual data on active instance ──────────────
                redis.set(key, data),

                // ── Store instanceId on registry so we can find it ────
                // Registry is always instance 0 (low overhead — only stores small strings)
                this.analyticsPool.getRegistry().set(
                    `${key}${this.metaSuffix}`,
                    instanceId
                ),
            ]);

            console.log(`✅ Analytics data stored — key: "${key}" on instance: "${instanceId}"`);

        } catch (err: any) {
            throw err;
        }
    }

    async gettingAnanlyticsData(key: any): Promise<any> {
        try {
            // ── 1. Ask registry which instance holds this key ─────────
            const instanceId = await this.analyticsPool
                .getRegistry()
                .get<string>(`${key}${this.metaSuffix}`);

            if (!instanceId) {
                // ── No registry entry — key doesn't exist or registry miss
                // Fallback: try current instance
                const { redis } = await this.analyticsPool.getInstanceWithId();
                return await redis.get(key);
            }

            // ── 2. Go directly to the correct instance ────────────────
            console.log(`📍 Analytics GET — key: "${key}" found on instance: "${instanceId}"`);
            return await this.analyticsPool.getInstanceById(instanceId).get(key);

        } catch (err: any) {
            throw err;
        }
    }

    async deletingAnanlyticsData(key: string): Promise<void> {
        try {
            // ── 1. Find which instance holds this key ─────────────────
            const instanceId = await this.analyticsPool
                .getRegistry()
                .get<string>(`${key}${this.metaSuffix}`);

            await Promise.all([
                // ── Delete actual data from the correct instance ───────
                instanceId
                    ? this.analyticsPool.getInstanceById(instanceId).del(key)
                    : (async () => {
                        const { redis } = await this.analyticsPool.getInstanceWithId();
                        return redis.del(key);
                    })(),

                // ── Delete the registry entry too ──────────────────────
                this.analyticsPool.getRegistry().del(`${key}${this.metaSuffix}`),
            ]);

            console.log(`🗑️  Analytics DELETE — key: "${key}" from instance: "${instanceId}"`);

        } catch (err: any) {
            throw err;
        }
    }

    // =================================================================
    // TEST / UPDATE DATA
    // =================================================================

    async settingTestData(key: any, data: any): Promise<void> {
        try {
            const { redis, instanceId } = await this.testDataPool.getInstanceWithId();

            await Promise.all([
                // ── Store actual data on active instance ──────────────
                redis.set(key, data),

                // ── Store instanceId on registry ──────────────────────
                this.testDataPool.getRegistry().set(
                    `${key}${this.metaSuffix}`,
                    instanceId
                ),
            ]);

            console.log(`✅ Test data stored — key: "${key}" on instance: "${instanceId}"`);

        } catch (err: any) {
            throw err;
        }
    }

    async gettingTestData(key: any): Promise<any> {
        try {
            // ── 1. Ask registry which instance holds this key ─────────
            const instanceId = await this.testDataPool
                .getRegistry()
                .get<string>(`${key}${this.metaSuffix}`);

            if (!instanceId) {
                // ── Fallback to current instance ──────────────────────
                const { redis } = await this.testDataPool.getInstanceWithId();
                return await redis.get(key);
            }

            // ── 2. Go directly to the correct instance ────────────────
            console.log(`📍 Test data GET — key: "${key}" found on instance: "${instanceId}"`);
            return await this.testDataPool.getInstanceById(instanceId).get(key);

        } catch (err: any) {
            throw err;
        }
    }

    async deletingTestData(key: string): Promise<void> {
        try {
            // ── 1. Find which instance holds this key ─────────────────
            const instanceId = await this.testDataPool
                .getRegistry()
                .get<string>(`${key}${this.metaSuffix}`);

            await Promise.all([
                // ── Delete actual data from the correct instance ───────
                instanceId
                    ? this.testDataPool.getInstanceById(instanceId).del(key)
                    : (async () => {
                        const { redis } = await this.testDataPool.getInstanceWithId();
                        return redis.del(key);
                    })(),

                // ── Delete the registry entry too ──────────────────────
                this.testDataPool.getRegistry().del(`${key}${this.metaSuffix}`),
            ]);

            console.log(`🗑️  Test data DELETE — key: "${key}" from instance: "${instanceId}"`);

        } catch (err: any) {
            throw err;
        }
    }

    // =================================================================
    // MONITORING
    // =================================================================

    getPoolStatus() {
        return {
            analytics: this.analyticsPool.getStatus(),
            testData:  this.testDataPool.getStatus(),
        };
    }

    // ── Force sync real counts from Upstash API ───────────────────────
    async forceSyncCounts(): Promise<void> {
        await Promise.all([
            this.analyticsPool.syncRealCounts(),
            this.testDataPool.syncRealCounts(),
        ]);
    }
}

export const reddisConfigForCaching = new ReddisConfigForCaching();