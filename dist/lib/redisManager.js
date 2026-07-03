"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const hashRing_1 = require("../utils/hashRing");
class RedisManager {
    // Dual Hash Rings
    authRing = new hashRing_1.HashRingService();
    dashboardRing = new hashRing_1.HashRingService();
    constructor() { }
    // Common Connection Logic
    async connect(connectionData) {
        try {
            let clientOptions = {
                pingInterval: 1000 * 60 * 4 // 4 minutes
            };
            if (connectionData.type === 2) {
                clientOptions.url = connectionData.url;
            }
            else {
                clientOptions.socket = {
                    host: connectionData.host,
                    port: connectionData.port,
                };
                if (connectionData.username)
                    clientOptions.username = connectionData.username;
                if (connectionData.password)
                    clientOptions.password = connectionData.password;
            }
            const instance = (0, redis_1.createClient)(clientOptions);
            const identifier = connectionData.type === 2 ? connectionData.url : `${connectionData.host}:${connectionData.port}`;
            instance.on("error", function (err) {
                console.error(`Redis Error [${identifier}]:`, err);
            });
            instance.on("connect", function () {
                console.log(`Redis Connected Successfully [${identifier}]`);
            });
            await instance.connect();
            return instance;
        }
        catch (err) {
            throw err;
        }
    }
    // ==========================================
    // DYNAMIC ADDITION METHODS (To be called from API/Startup)
    // ==========================================
    async addAuthInstances(configs) {
        // Only fetch nodes that were previously added dynamically via API
        const dynamicOldConfigs = this.authRing.getActiveNodes().filter(c => c.isDynamic);
        for (let i = 0; i < configs.length; i++) {
            const client = await this.connect(configs[i]);
            this.authRing.addNode(configs[i], client);
            const identifier = configs[i].type === 2 ? configs[i].url : configs[i].host;
            console.log(`Added node to AUTH Ring: ${identifier}`);
        }
        if (dynamicOldConfigs.length > 0) {
            await this.rebalanceRing(this.authRing, dynamicOldConfigs);
        }
    }
    async addDashboardInstances(configs) {
        // Only fetch nodes that were previously added dynamically via API
        const dynamicOldConfigs = this.dashboardRing.getActiveNodes().filter(c => c.isDynamic);
        for (let i = 0; i < configs.length; i++) {
            const client = await this.connect(configs[i]);
            this.dashboardRing.addNode(configs[i], client);
            const identifier = configs[i].type === 2 ? configs[i].url : configs[i].host;
            console.log(`Added node to DASHBOARD Ring: ${identifier}`);
        }
        if (dynamicOldConfigs.length > 0) {
            await this.rebalanceRing(this.dashboardRing, dynamicOldConfigs);
        }
    }
    // ==========================================
    // KEY MIGRATION PROTOCOLS (Using DUMP/RESTORE)
    // ==========================================
    async rebalanceRing(ring, oldConfigs) {
        console.log(`[Rebalance] Starting DUMP/RESTORE key migration logic...`);
        let migratedCount = 0;
        for (const oldConfig of oldConfigs) {
            const oldClient = ring.getClient(oldConfig);
            if (!oldClient)
                continue;
            try {
                const keys = await oldClient.keys("*");
                for (const key of keys) {
                    const userId = key.split(":")[0];
                    const targetClient = ring.getNodeClient(userId);
                    if (targetClient && targetClient !== oldClient) {
                        const success = await this.migrateKey(oldClient, targetClient, key);
                        if (success) {
                            await oldClient.del(key);
                            migratedCount++;
                        }
                    }
                }
            }
            catch (err) {
                const identifier = oldConfig.type === 2 ? oldConfig.url : `${oldConfig.host}:${oldConfig.port}`;
                console.error(`Error migrating keys from ${identifier}:`, err);
            }
        }
        console.log(`[Rebalance] Successfully migrated ${migratedCount} misplaced keys.`);
    }
    async drainNode(ring, dyingClient) {
        console.log(`[Drain] Migrating all keys off dying node to survivors...`);
        let migratedCount = 0;
        try {
            const keys = await dyingClient.keys("*");
            for (const key of keys) {
                const userId = key.split(":")[0];
                const targetClient = ring.getNodeClient(userId);
                if (targetClient && targetClient !== dyingClient) {
                    const success = await this.migrateKey(dyingClient, targetClient, key);
                    if (success) {
                        await dyingClient.del(key);
                        migratedCount++;
                    }
                }
            }
        }
        catch (err) {
            console.error(`[Drain] Error draining keys from dying node:`, err);
        }
        console.log(`[Drain] Successfully drained ${migratedCount} keys.`);
    }
    // ==========================================
    // MANUAL KEY MIGRATION FALLBACK
    // ==========================================
    async migrateKey(oldClient, targetClient, key) {
        try {
            const dumpValue = await oldClient.dump(key);
            if (!dumpValue)
                return false;
            const pttl = await oldClient.pTTL(key);
            await targetClient.restore(key, pttl > 0 ? pttl : 0, dumpValue, { REPLACE: true });
            return true;
        }
        catch (err) {
            if (err.message && err.message.includes("DUMP payload version or checksum are wrong")) {
                // Silently fall back to manual copy to avoid flooding the console for every key
                return await this.manualKeyCopy(oldClient, targetClient, key);
            }
            throw err;
        }
    }
    async manualKeyCopy(oldClient, targetClient, key) {
        const type = await oldClient.type(key);
        const pttl = await oldClient.pTTL(key);
        try {
            switch (type) {
                case "string":
                    const strVal = await oldClient.get(key);
                    if (strVal !== null) {
                        if (pttl > 0) {
                            await targetClient.set(key, strVal, { PX: pttl });
                        }
                        else {
                            await targetClient.set(key, strVal);
                        }
                    }
                    break;
                case "hash":
                    const hashVal = await oldClient.hGetAll(key);
                    if (Object.keys(hashVal).length > 0) {
                        // In Node Redis v4, hSet handles objects directly
                        await targetClient.hSet(key, hashVal);
                        if (pttl > 0)
                            await targetClient.pExpire(key, pttl);
                    }
                    break;
                case "list":
                    const listVal = await oldClient.lRange(key, 0, -1);
                    if (listVal.length > 0) {
                        await targetClient.del(key);
                        await targetClient.rPush(key, listVal);
                        if (pttl > 0)
                            await targetClient.pExpire(key, pttl);
                    }
                    break;
                case "set":
                    const setVal = await oldClient.sMembers(key);
                    if (setVal.length > 0) {
                        await targetClient.del(key);
                        await targetClient.sAdd(key, setVal);
                        if (pttl > 0)
                            await targetClient.pExpire(key, pttl);
                    }
                    break;
                case "zset":
                    const zsetVal = await oldClient.zRangeWithScores(key, 0, -1);
                    if (zsetVal.length > 0) {
                        await targetClient.del(key);
                        const zaddArgs = zsetVal.map(item => ({ score: item.score, value: item.value }));
                        await targetClient.zAdd(key, zaddArgs);
                        if (pttl > 0)
                            await targetClient.pExpire(key, pttl);
                    }
                    break;
                default:
                    console.warn(`[Migration] Unsupported key type '${type}' for key ${key}. Skipping manual fallback.`);
                    return false;
            }
            return true;
        }
        catch (err) {
            console.error(`[Migration] Manual copy failed for key ${key} of type ${type}:`, err);
            return false;
        }
    }
    // ==========================================
    // USAGE METHODS FOR CONTROLLERS
    // ==========================================
    getAuthRedis(userId) {
        const client = this.authRing.getNodeClient(userId);
        if (!client)
            throw new Error("No Redis instances available in Auth Ring.");
        return client;
    }
    getDashboardRedis(userId) {
        const client = this.dashboardRing.getNodeClient(userId);
        if (!client)
            throw new Error("No Redis instances available in Dashboard Ring.");
        return client;
    }
    // ==========================================
    // SHUTDOWN
    // ==========================================
    async disconnectAll() {
        console.log("Disconnecting Auth Ring...");
        await this.authRing.disconnectAll();
        console.log("Disconnecting Dashboard Ring...");
        await this.dashboardRing.disconnectAll();
        console.log("All Redis clusters shut down successfully.");
    }
    // 1. Saare active Redis nodes dekhne ke liye
    getActiveClusters() {
        return {
            authNodes: this.authRing.getActiveNodes(),
            dashboardNodes: this.dashboardRing.getActiveNodes(),
        };
    }
    // 2. Auth Ring se specific server hatana
    async removeAuthInstance(configData) {
        const config = this.authRing.getConfigByIdentifier(configData);
        if (!config)
            return false;
        const dyingClient = this.authRing.getClient(config);
        if (!dyingClient)
            return false;
        // 1. Mathematically remove node from ring first so hashes route to survivors
        this.authRing.removeNode(config);
        // 2. Safely drain remaining keys from dying connection to survivors
        await this.drainNode(this.authRing, dyingClient);
        // 3. Disconnect connection
        await dyingClient.disconnect();
        return true;
    }
    // 3. Dashboard Ring se specific server hatana
    async removeDashboardInstance(configData) {
        const config = this.dashboardRing.getConfigByIdentifier(configData);
        if (!config)
            return false;
        const dyingClient = this.dashboardRing.getClient(config);
        if (!dyingClient)
            return false;
        // 1. Mathematically remove node from ring first so hashes route to survivors
        this.dashboardRing.removeNode(config);
        // 2. Safely drain remaining keys from dying connection to survivors
        await this.drainNode(this.dashboardRing, dyingClient);
        // 3. Disconnect connection
        await dyingClient.disconnect();
        return true;
    }
}
// Singleton Pattern export
const redisManager = new RedisManager();
exports.default = redisManager;
