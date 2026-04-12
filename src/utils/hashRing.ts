import { createClient, RedisClientType } from "redis";
import * as crypto from "crypto";
import { RedisInstanceConfig } from "../types/redis.types";
import { REDIS_PORT } from "../config/env";

// ==========================================
// 1. HASH RING HELPER CLASS (Reusable)
// ==========================================
export class HashRingService {
  private hashRing: number[] = [];
  private ringMap = new Map<number, RedisInstanceConfig>();
  private instanceMap = new Map<RedisInstanceConfig, RedisClientType>();
  private VIRTUAL_NODES: number = 100;

  private generateHash(key: string): number {
    const hash = crypto.createHash("md5").update(key).digest("hex");
    return parseInt(hash.substring(0, 8), 16);
  }

  // Node add karna Hash Ring mein
  public addNode(config: RedisInstanceConfig, client: RedisClientType) {
    this.instanceMap.set(config, client);

    for (let i = 0; i < this.VIRTUAL_NODES; i++) {
      const nodeKey = config.host + ":" + config.port + "-VNODE-" + i;
      const hash = this.generateHash(nodeKey);
      
      this.hashRing.push(hash);
      this.ringMap.set(hash, config);
    }
    
    // Sort ascending for clockwise traversal
    this.hashRing.sort(function(a, b) {
      return a - b;
    });
  }

  // Node remove karna Hash Ring se
  public removeNode(config: RedisInstanceConfig) {
    this.instanceMap.delete(config);

    for (let i = 0; i < this.VIRTUAL_NODES; i++) {
      const nodeKey = config.host + ":" + config.port + "-VNODE-" + i;
      const hash = this.generateHash(nodeKey);
      
      const index = this.hashRing.indexOf(hash);
      if (index > -1) {
        this.hashRing.splice(index, 1);
      }
      this.ringMap.delete(hash);
    }
  }

  // User ke liye connection (Client) laana
  public getNodeClient(userId: string): RedisClientType | undefined {
    if (this.hashRing.length === 0) return undefined;

    const userHash = this.generateHash(userId);
    let targetNodeHash = this.hashRing[0]; 

    for (let i = 0; i < this.hashRing.length; i++) {
      if (this.hashRing[i] >= userHash) {
        targetNodeHash = this.hashRing[i];
        break;
      }
    }

    const targetConfig = this.ringMap.get(targetNodeHash);
    if (targetConfig) {
      return this.instanceMap.get(targetConfig);
    }
    return undefined;
  }

  // Observability: Check karna ki user kis Redis server par map hua hai
  public getNodeConfig(userId: string): RedisInstanceConfig | undefined {
    if (this.hashRing.length === 0) return undefined;

    const userHash = this.generateHash(userId);
    let targetNodeHash = this.hashRing[0]; 

    for (let i = 0; i < this.hashRing.length; i++) {
      if (this.hashRing[i] >= userHash) {
        targetNodeHash = this.hashRing[i];
        break;
      }
    }
    return this.ringMap.get(targetNodeHash);
  }

  // Shutdown logic
  public async disconnectAll() {
    for (let [config, client] of this.instanceMap) {
      await client.disconnect();
    }
    this.instanceMap.clear();
    this.hashRing = [];
    this.ringMap.clear();
  }
}