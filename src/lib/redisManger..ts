import { createClient, RedisClientType } from "redis";
import { RedisInstanceConfig } from "../types/redis.types";
import { REDIS_PORT } from "../config/env";
import { HashRingService } from "../utils/hashRing";

class RedisManager {
  // Dual Hash Rings
  public authRing = new HashRingService();
  public dashboardRing = new HashRingService();

  constructor() {}

  // Common Connection Logic
  private async connect(connectionData: RedisInstanceConfig): Promise<RedisClientType> {
    try {
      const instance = createClient({
        username: connectionData.username,
        password: connectionData.password,
        socket: {
          host: connectionData.host,
          port: connectionData.port || parseInt(REDIS_PORT as string, 10) || 6379,
        },
      });
      
      instance.on("error", function(err: any) {
        console.error(`Redis Error [${connectionData.host}]:`, err);
      });
      
      instance.on("connect", function() {
        console.log(`Redis Connected Successfully [${connectionData.host}]`);
      });

      await instance.connect();
      return instance as RedisClientType;
    } catch (err: any) {
      throw err;
    }
  }

  // ==========================================
  // DYNAMIC ADDITION METHODS (To be called from API/Startup)
  // ==========================================

  public async addAuthInstances(configs: RedisInstanceConfig[]) {
    for (let i = 0; i < configs.length; i++) {
      const client = await this.connect(configs[i]);
      this.authRing.addNode(configs[i], client);
      console.log(`Added node to AUTH Ring: ${configs[i].host}`);
    }
  }

  public async addDashboardInstances(configs: RedisInstanceConfig[]) {
    for (let i = 0; i < configs.length; i++) {
      const client = await this.connect(configs[i]);
      this.dashboardRing.addNode(configs[i], client);
      console.log(`Added node to DASHBOARD Ring: ${configs[i].host}`);
    }
  }

  // ==========================================
  // USAGE METHODS FOR CONTROLLERS
  // ==========================================

  public getAuthRedis(userId: string): RedisClientType {
    const client = this.authRing.getNodeClient(userId);
    if (!client) throw new Error("No Redis instances available in Auth Ring.");
    return client;
  }

  public getDashboardRedis(userId: string): RedisClientType {
    const client = this.dashboardRing.getNodeClient(userId);
    if (!client) throw new Error("No Redis instances available in Dashboard Ring.");
    return client;
  }

  // ==========================================
  // SHUTDOWN
  // ==========================================
  public async disconnectAll() {
    console.log("Disconnecting Auth Ring...");
    await this.authRing.disconnectAll();
    
    console.log("Disconnecting Dashboard Ring...");
    await this.dashboardRing.disconnectAll();
    
    console.log("✅ All Redis clusters shut down successfully.");
  }
}

// Singleton Pattern export
const redisManager = new RedisManager();
export default redisManager;