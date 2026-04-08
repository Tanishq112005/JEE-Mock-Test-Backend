import { Redis } from "@upstash/redis";
import { RedisInstanceConfig, UpstashStats } from "../types/redis";

class RedisMonitor {

    private redisKeys: RedisInstanceConfig[] = [];
    private redisInstances = new Map<RedisInstanceConfig, Redis>();
    private redisCountForCaching: number = 0;
    private redisCountForOtherService: number = 0;

    constructor() { }

    async connect(connectionData: RedisInstanceConfig): Promise<Redis> {
        try {
            const instance = new Redis({
                url: connectionData.url,
                token: connectionData.token
            });
            return instance;
        } catch (err: any) {
            throw err;
        }
    }

    async connectionOfInstances(redisKeys: RedisInstanceConfig[]) {
        try {
            for (let i = 0; i < redisKeys.length; i++) {
                const instance = await this.connect(redisKeys[i]);
                this.redisInstances.set(redisKeys[i], instance);
            }
        } catch (err: any) {
            throw err;
        }
    }  

    async addingInstances(
        redisNewConnection: RedisInstanceConfig[],
        redisCountForCaching: number,
        redisCountForOtherService: number
    ) {
        try {
            if (redisCountForCaching + redisCountForOtherService >= redisNewConnection.length) {
                throw "Incorrect Number of the Service Dividing of the Redis";
            }
            await this.connectionOfInstances(redisNewConnection);
            this.redisCountForCaching += redisCountForCaching;
            this.redisCountForOtherService += redisCountForOtherService;
        } catch (err: any) {
            throw err;
        }
    }

    disconnectOne(redisConfig: RedisInstanceConfig) {
        if (this.redisInstances.has(redisConfig)) {
            this.redisInstances.delete(redisConfig);
            console.log(`Instance [${redisConfig.url}] disconnected.`);
        } else {
            console.warn(`Instance [${redisConfig.url}] not found.`);
        }
    }

    disconnectAll() {
        this.redisInstances.clear();
        this.redisCountForCaching = 0;
        this.redisCountForOtherService = 0;
        console.log("All instances disconnected.");
    }

    activeInstances(): number {
        return this.redisInstances.size;
    }

    activeInstancesList(): RedisInstanceConfig[] {
        const redisInstancesList: RedisInstanceConfig[] = [];
        for (let [key] of this.redisInstances) {
            redisInstancesList.push(key);
        }
        return redisInstancesList;
    }

    async redisInfo(redisConfig: RedisInstanceConfig): Promise<UpstashStats> {

        try {
            const response = await fetch(
                `https://api.upstash.com/v2/redis/stats/${redisConfig.databaseId}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Basic " + btoa(`${redisConfig.email}:${redisConfig.apiKey}`)
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch stats for [${redisConfig.url}]: ${response.statusText}`);
            }

            return await response.json() as UpstashStats;
        }

        catch (err: any) {
            throw err;
        }
    }
    
    
    
     
    
    
    

     




}