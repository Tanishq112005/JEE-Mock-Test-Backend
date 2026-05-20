"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const env_1 = require("../config/env");
const hashRing_1 = require("../utils/hashRing");
class RedisManager {
    // Dual Hash Rings
    authRing = new hashRing_1.HashRingService();
    dashboardRing = new hashRing_1.HashRingService();
    constructor() { }
    // Common Connection Logic
    async connect(connectionData) {
        try {
            const instance = (0, redis_1.createClient)({
                username: connectionData.username,
                password: connectionData.password,
                socket: {
                    host: connectionData.host,
                    port: connectionData.port || parseInt(env_1.REDIS_PORT, 10) || 6379,
                },
            });
            instance.on("error", function (err) {
                console.error(`Redis Error [${connectionData.host}]:`, err);
            });
            instance.on("connect", function () {
                console.log(`Redis Connected Successfully [${connectionData.host}]`);
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
        const oldConfigs = this.authRing.getActiveNodes();
        for (let i = 0; i < configs.length; i++) {
            const client = await this.connect(configs[i]);
            this.authRing.addNode(configs[i], client);
            console.log(`Added node to AUTH Ring: ${configs[i].host}`);
        }
        if (oldConfigs.length > 0) {
            await this.rebalanceRing(this.authRing, oldConfigs);
        }
    }
    async addDashboardInstances(configs) {
        const oldConfigs = this.dashboardRing.getActiveNodes();
        for (let i = 0; i < configs.length; i++) {
            const client = await this.connect(configs[i]);
            this.dashboardRing.addNode(configs[i], client);
            console.log(`Added node to DASHBOARD Ring: ${configs[i].host}`);
        }
        if (oldConfigs.length > 0) {
            await this.rebalanceRing(this.dashboardRing, oldConfigs);
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
                        // Must use DUMP and RESTORE for complex data types (bitmaps, etc)
                        const dumpValue = await oldClient.dump(key);
                        const pttl = await oldClient.pTTL(key);
                        if (dumpValue) {
                            await targetClient.restore(key, pttl > 0 ? pttl : 0, dumpValue, { REPLACE: true });
                            await oldClient.del(key);
                            migratedCount++;
                        }
                    }
                }
            }
            catch (err) {
                console.error(`Error migrating keys from ${oldConfig.host}:${oldConfig.port}:`, err);
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
                // Target client should now inherently mathematically avoid the dying node because it was removed from the ring
                if (targetClient && targetClient !== dyingClient) {
                    const dumpValue = await dyingClient.dump(key);
                    const pttl = await dyingClient.pTTL(key);
                    if (dumpValue) {
                        await targetClient.restore(key, pttl > 0 ? pttl : 0, dumpValue, { REPLACE: true });
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
    async removeAuthInstance(host, port) {
        const config = this.authRing.getConfigByHostPort(host, port);
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
    async removeDashboardInstance(host, port) {
        const config = this.dashboardRing.getConfigByHostPort(host, port);
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
