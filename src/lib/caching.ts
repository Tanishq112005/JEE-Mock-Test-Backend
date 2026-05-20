// =================================================================
// lib/caching.ts
// Redis caching layer — dynamically routed via Dashboard Hash Ring
// =================================================================

import redisManager from "./redisManager";

class CacheService {
  constructor() {
    console.log("CacheService initialized (Routing via Dashboard Ring)");
  }

  private getClientForKey(key: string) {
    // Keys are generally formulated as `${studentId}:...`
    // We extract the first part to ensure all a student's data routes to the exact same server instance.
    const userId = key.split(":")[0];

    // If there's no colon, it will just hash by the key itself, which still deterministically routes it.
    return redisManager.getDashboardRedis(userId);
  }

  async setCache(key: string, data: any): Promise<void> {
    try {
      const client = this.getClientForKey(key);
      await client.set(key, JSON.stringify(data));
      console.log(`Cache SET - key: "${key}"`);
    } catch (err: any) {
      console.error(`Cache SET failed - key: "${key}":`, err.message);
      throw err;
    }
  }

  async getCache(key: string): Promise<any> {
    try {
      const client = this.getClientForKey(key);
      const raw = await client.get(key);
      if (!raw) return null;

      if (typeof raw === "string") {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }
      return raw;
    } catch (err: any) {
      console.error(`Cache GET failed - key: "${key}":`, err.message);
      return null; // never crash the caller on a cache miss
    }
  }

  async deleteCache(key: string): Promise<void> {
    try {
      const client = this.getClientForKey(key);
      await client.del(key);
      console.log(`Cache DELETE - key: "${key}"`);
    } catch (err: any) {
      console.error(`Cache DELETE failed - key: "${key}":`, err.message);
    }
  }
}

export const cacheService = new CacheService();
