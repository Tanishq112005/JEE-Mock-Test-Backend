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
        for (let i = 0; i < configs.length; i++) {
            const client = await this.connect(configs[i]);
            this.authRing.addNode(configs[i], client);
            console.log(`Added node to AUTH Ring: ${configs[i].host}`);
        }
    }
    async addDashboardInstances(configs) {
        for (let i = 0; i < configs.length; i++) {
            const client = await this.connect(configs[i]);
            this.dashboardRing.addNode(configs[i], client);
            console.log(`Added node to DASHBOARD Ring: ${configs[i].host}`);
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
        console.log("✅ All Redis clusters shut down successfully.");
    }
    // 1. Saare active Redis nodes dekhne ke liye
    getActiveClusters() {
        return {
            authNodes: this.authRing.getActiveNodes(),
            dashboardNodes: this.dashboardRing.getActiveNodes()
        };
    }
    // 2. Auth Ring se specific server hatana
    async removeAuthInstance(host, port) {
        return await this.authRing.removeNodeByHostPort(host, port);
    }
    // 3. Dashboard Ring se specific server hatana
    async removeDashboardInstance(host, port) {
        return await this.dashboardRing.removeNodeByHostPort(host, port);
    }
}
// Singleton Pattern export
const redisManager = new RedisManager();
exports.default = redisManager;
