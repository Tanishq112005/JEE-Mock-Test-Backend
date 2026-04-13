"use strict";
// =================================================================
// lib/caching.ts
// Redis caching layer — dynamically routed via Dashboard Hash Ring
// =================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const redisManager_1 = __importDefault(require("./redisManager"));
class CacheService {
    constructor() {
        console.log("✅ CacheService initialized (Routing via Dashboard Ring)");
    }
    getClientForKey(key) {
        // Keys are generally formulated as `${studentId}:...`
        // We extract the first part to ensure all a student's data routes to the exact same server instance.
        const userId = key.split(':')[0];
        // If there's no colon, it will just hash by the key itself, which still deterministically routes it.
        return redisManager_1.default.getDashboardRedis(userId);
    }
    async setCache(key, data) {
        try {
            const client = this.getClientForKey(key);
            await client.set(key, JSON.stringify(data));
            console.log(`✅ Cache SET — key: "${key}"`);
        }
        catch (err) {
            console.error(`❌ Cache SET failed — key: "${key}":`, err.message);
            throw err;
        }
    }
    async getCache(key) {
        try {
            const client = this.getClientForKey(key);
            const raw = await client.get(key);
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
            console.error(`❌ Cache GET failed — key: "${key}":`, err.message);
            return null; // never crash the caller on a cache miss
        }
    }
    async deleteCache(key) {
        try {
            const client = this.getClientForKey(key);
            await client.del(key);
            console.log(`🗑️  Cache DELETE — key: "${key}"`);
        }
        catch (err) {
            console.error(`❌ Cache DELETE failed — key: "${key}":`, err.message);
        }
    }
}
exports.cacheService = new CacheService();
