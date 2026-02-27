"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisInstancePool = void 0;
const redis_1 = require("@upstash/redis");
const upstashMonitor_1 = require("./upstashMonitor");
const REQUEST_LIMIT = 250_000;
const SYNC_INTERVAL_MS = 60_000;
class RedisInstancePool {
    instances = new Map();
    instanceIds = []; // ordered list — defines circular order
    currentIndex = 0; // pointer into instanceIds[]
    registryRedis; // instance 0 — acts as key registry
    lastSyncTime = 0;
    constructor(configs) {
        configs.forEach((config) => {
            this.instances.set(config.id, {
                id: config.id,
                dbId: config.dbId,
                redis: new redis_1.Redis({ url: config.url, token: config.token }),
                requestCount: 0,
                realCount: 0,
            });
            this.instanceIds.push(config.id);
        });
        // ── Instance 0 is always the registry ────────────────────────
        this.registryRedis = this.instances.get(this.instanceIds[0]).redis;
        console.log(`✅ Redis Pool initialized — ${configs.length} instances in circular rotation`);
        console.log(`📋 Rotation order: ${this.instanceIds.join(" → ")} → (wraps back to start)`);
        // ── Sync real counts from Upstash on startup ──────────────────
        this.syncRealCounts();
    }
    // =================================================================
    // SYNC — Fetch real counts from Upstash Management API
    // =================================================================
    async syncRealCounts() {
        try {
            const instanceList = this.instanceIds.map((id) => ({
                instanceId: id,
                dbId: this.instances.get(id).dbId,
            }));
            const stats = await upstashMonitor_1.upstashMonitor.getAllInstanceStats(instanceList);
            stats.forEach((stat) => {
                const instance = this.instances.get(stat.instanceId);
                if (instance) {
                    instance.realCount = stat.monthlyRequests;
                    instance.requestCount = stat.monthlyRequests; // align local with real
                }
            });
            this.lastSyncTime = Date.now();
            // ── After sync, set currentIndex to first non-exhausted instance ─
            for (let i = 0; i < this.instanceIds.length; i++) {
                const instance = this.instances.get(this.instanceIds[i]);
                if (instance.realCount < REQUEST_LIMIT) {
                    this.currentIndex = i;
                    break;
                }
            }
            console.log(`🔄 Synced real counts from Upstash API`);
            this.logStatus();
        }
        catch (err) {
            console.error("❌ Failed to sync real counts:", err.message);
        }
    }
    // ── Auto sync if interval has passed ─────────────────────────────
    async autoSync() {
        const now = Date.now();
        if (now - this.lastSyncTime > SYNC_INTERVAL_MS) {
            await this.syncRealCounts();
        }
    }
    // =================================================================
    // GET INSTANCE — with circular rotation
    // =================================================================
    async getInstanceWithId() {
        // ── Auto sync every 60s to keep counts accurate ───────────────
        await this.autoSync();
        const currentId = this.instanceIds[this.currentIndex];
        const current = this.instances.get(currentId);
        // ── Hit the limit — rotate to next in circle ──────────────────
        if (current.requestCount >= REQUEST_LIMIT) {
            this.rotate();
        }
        const active = this.instances.get(this.instanceIds[this.currentIndex]);
        active.requestCount++;
        return {
            redis: active.redis,
            instanceId: active.id,
        };
    }
    // =================================================================
    // ROTATE — circular, wraps back to index 0 after last instance
    // =================================================================
    rotate() {
        const exhaustedId = this.instanceIds[this.currentIndex];
        // ── Move to next, wrap around if at end (circular) ────────────
        this.currentIndex = (this.currentIndex + 1) % this.instanceIds.length;
        const nextId = this.instanceIds[this.currentIndex];
        const nextInstance = this.instances.get(nextId);
        // ── Reset count when reusing — means full circle completed ────
        // This happens when Upstash resets monthly (all instances exhausted)
        if (nextInstance.requestCount >= REQUEST_LIMIT) {
            console.log(`♻️  Full circle completed — resetting "${nextId}" for reuse (new month cycle)`);
            nextInstance.requestCount = 0;
            nextInstance.realCount = 0;
        }
        console.log(`🔄 Rotated: "${exhaustedId}" exhausted → now using "${nextId}"`);
        console.log(`📊 Circle position: ${this.currentIndex + 1} / ${this.instanceIds.length}`);
    }
    // =================================================================
    // GET SPECIFIC INSTANCE BY ID — used for targeted get/delete
    // =================================================================
    getInstanceById(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            console.warn(`⚠️  Instance "${instanceId}" not found — falling back to current instance`);
            return this.instances.get(this.instanceIds[this.currentIndex]).redis;
        }
        return instance.redis;
    }
    // ── Registry is always instance 0 ────────────────────────────────
    getRegistry() {
        return this.registryRedis;
    }
    // =================================================================
    // STATUS & MONITORING
    // =================================================================
    getStatus() {
        return this.instanceIds.map((id, index) => {
            const instance = this.instances.get(id);
            return {
                instanceId: id,
                position: `${index + 1} / ${this.instanceIds.length}`,
                realCount: instance.realCount,
                localCount: instance.requestCount,
                remaining: Math.max(0, REQUEST_LIMIT - instance.requestCount),
                usagePercent: `${((instance.requestCount / REQUEST_LIMIT) * 100).toFixed(1)}%`,
                isActive: index === this.currentIndex,
                lastSyncedAt: new Date(this.lastSyncTime).toISOString(),
            };
        });
    }
    logStatus() {
        console.log("📊 Redis Pool Status:");
        this.instanceIds.forEach((id, index) => {
            const i = this.instances.get(id);
            console.log(`  [${index + 1}/${this.instanceIds.length}] ${id}` +
                ` | real: ${i.realCount}` +
                ` | local: ${i.requestCount}` +
                ` | remaining: ${Math.max(0, REQUEST_LIMIT - i.requestCount)}` +
                ` | active: ${index === this.currentIndex}`);
        });
    }
    resetCounts() {
        this.instances.forEach((instance) => {
            instance.requestCount = 0;
            instance.realCount = 0;
        });
        this.currentIndex = 0;
        console.log("🔄 Redis pool counts manually reset");
    }
}
exports.RedisInstancePool = RedisInstancePool;
