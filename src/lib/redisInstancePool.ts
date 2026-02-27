import { Redis } from "@upstash/redis";
import { upstashMonitor } from "./upstashMonitor";

const REQUEST_LIMIT    = 250_000;
const SYNC_INTERVAL_MS = 60_000;   

export interface RedisInstanceConfig {
    id:    string;   // unique stable ID — never changes
    dbId:  string;   // Upstash database ID for management API
    url:   string;
    token: string;
}

interface RedisInstance {
    id:           string;
    dbId:         string;
    redis:        Redis;
    requestCount: number;   // local count (fast, incremented per request)
    realCount:    number;   // synced from Upstash API (accurate, updated every 60s)
}

class RedisInstancePool {
    private instances:     Map<string, RedisInstance> = new Map();
    private instanceIds:   string[] = [];              // ordered list — defines circular order
    private currentIndex:  number   = 0;               // pointer into instanceIds[]
    private registryRedis: Redis;                      // instance 0 — acts as key registry
    private lastSyncTime:  number   = 0;

    constructor(configs: RedisInstanceConfig[]) {
        configs.forEach((config) => {
            this.instances.set(config.id, {
                id:           config.id,
                dbId:         config.dbId,
                redis:        new Redis({ url: config.url, token: config.token }),
                requestCount: 0,
                realCount:    0,
            });
            this.instanceIds.push(config.id);
        });

        // ── Instance 0 is always the registry ────────────────────────
        this.registryRedis = this.instances.get(this.instanceIds[0])!.redis;

        console.log(`✅ Redis Pool initialized — ${configs.length} instances in circular rotation`);
        console.log(`📋 Rotation order: ${this.instanceIds.join(" → ")} → (wraps back to start)`);

        // ── Sync real counts from Upstash on startup ──────────────────
        this.syncRealCounts();
    }

    // =================================================================
    // SYNC — Fetch real counts from Upstash Management API
    // =================================================================
    async syncRealCounts(): Promise<void> {
        try {
            const instanceList = this.instanceIds.map((id) => ({
                instanceId: id,
                dbId:       this.instances.get(id)!.dbId,
            }));

            const stats = await upstashMonitor.getAllInstanceStats(instanceList);

            stats.forEach((stat : any) => {
                const instance = this.instances.get(stat.instanceId);
                if (instance) {
                    instance.realCount    = stat.monthlyRequests;
                    instance.requestCount = stat.monthlyRequests;  // align local with real
                }
            });

            this.lastSyncTime = Date.now();

            // ── After sync, set currentIndex to first non-exhausted instance ─
            for (let i = 0; i < this.instanceIds.length; i++) {
                const instance = this.instances.get(this.instanceIds[i])!;
                if (instance.realCount < REQUEST_LIMIT) {
                    this.currentIndex = i;
                    break;
                }
            }

            console.log(`🔄 Synced real counts from Upstash API`);
            this.logStatus();

        } catch (err: any) {
            console.error("❌ Failed to sync real counts:", err.message);
        }
    }

    // ── Auto sync if interval has passed ─────────────────────────────
    private async autoSync(): Promise<void> {
        const now = Date.now();
        if (now - this.lastSyncTime > SYNC_INTERVAL_MS) {
            await this.syncRealCounts();
        }
    }

    // =================================================================
    // GET INSTANCE — with circular rotation
    // =================================================================
    async getInstanceWithId(): Promise<{ redis: Redis; instanceId: string }> {
        // ── Auto sync every 60s to keep counts accurate ───────────────
        await this.autoSync();

        const currentId = this.instanceIds[this.currentIndex];
        const current   = this.instances.get(currentId)!;

        // ── Hit the limit — rotate to next in circle ──────────────────
        if (current.requestCount >= REQUEST_LIMIT) {
            this.rotate();
        }

        const active = this.instances.get(this.instanceIds[this.currentIndex])!;
        active.requestCount++;

        return {
            redis:      active.redis,
            instanceId: active.id,
        };
    }

    // =================================================================
    // ROTATE — circular, wraps back to index 0 after last instance
    // =================================================================
    private rotate(): void {
        const exhaustedId = this.instanceIds[this.currentIndex];

        // ── Move to next, wrap around if at end (circular) ────────────
        this.currentIndex = (this.currentIndex + 1) % this.instanceIds.length;

        const nextId       = this.instanceIds[this.currentIndex];
        const nextInstance = this.instances.get(nextId)!;

        // ── Reset count when reusing — means full circle completed ────
        // This happens when Upstash resets monthly (all instances exhausted)
        if (nextInstance.requestCount >= REQUEST_LIMIT) {
            console.log(`♻️  Full circle completed — resetting "${nextId}" for reuse (new month cycle)`);
            nextInstance.requestCount = 0;
            nextInstance.realCount    = 0;
        }

        console.log(`🔄 Rotated: "${exhaustedId}" exhausted → now using "${nextId}"`);
        console.log(`📊 Circle position: ${this.currentIndex + 1} / ${this.instanceIds.length}`);
    }

    // =================================================================
    // GET SPECIFIC INSTANCE BY ID — used for targeted get/delete
    // =================================================================
    getInstanceById(instanceId: string): Redis {
        const instance = this.instances.get(instanceId);

        if (!instance) {
            console.warn(`⚠️  Instance "${instanceId}" not found — falling back to current instance`);
            return this.instances.get(this.instanceIds[this.currentIndex])!.redis;
        }

        return instance.redis;
    }

    // ── Registry is always instance 0 ────────────────────────────────
    getRegistry(): Redis {
        return this.registryRedis;
    }

    // =================================================================
    // STATUS & MONITORING
    // =================================================================
    getStatus() {
        return this.instanceIds.map((id, index) => {
            const instance = this.instances.get(id)!;
            return {
                instanceId:   id,
                position:     `${index + 1} / ${this.instanceIds.length}`,
                realCount:    instance.realCount,
                localCount:   instance.requestCount,
                remaining:    Math.max(0, REQUEST_LIMIT - instance.requestCount),
                usagePercent: `${((instance.requestCount / REQUEST_LIMIT) * 100).toFixed(1)}%`,
                isActive:     index === this.currentIndex,
                lastSyncedAt: new Date(this.lastSyncTime).toISOString(),
            };
        });
    }

    private logStatus(): void {
        console.log("📊 Redis Pool Status:");
        this.instanceIds.forEach((id, index) => {
            const i = this.instances.get(id)!;
            console.log(
                `  [${index + 1}/${this.instanceIds.length}] ${id}` +
                ` | real: ${i.realCount}` +
                ` | local: ${i.requestCount}` +
                ` | remaining: ${Math.max(0, REQUEST_LIMIT - i.requestCount)}` +
                ` | active: ${index === this.currentIndex}`
            );
        });
    }

    resetCounts(): void {
        this.instances.forEach((instance) => {
            instance.requestCount = 0;
            instance.realCount    = 0;
        });
        this.currentIndex = 0;
        console.log("🔄 Redis pool counts manually reset");
    }
}

export { RedisInstancePool };