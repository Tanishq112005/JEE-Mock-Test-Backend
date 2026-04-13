import {
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_USERNAME,
} from "../config/env";
import { createClient, RedisClientType } from "redis";

class RedisConfig {
  public client: RedisClientType;

  constructor() {
    const port = parseInt(REDIS_PORT as string, 10) || 6379;

    this.client = createClient({
      username: REDIS_USERNAME,
      password: REDIS_PASSWORD,
      socket: {
        host: REDIS_HOST,
        port: port,
      },
    });

    this.client.on("error", (err: any) =>
      console.log("Redis Client Error:", err),
    );
    this.client.on("connect", () =>
      console.log("Redis Connected Successfully"),
    );

    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
    }
  }

  getRedisEmailKey(email: string) {
    return `OTP:${email}`;
  }

  getRedisLimitKey(keyPrefix: string, identifier: string) {
    return `rate_limit:${keyPrefix}:${identifier}`;
  }
}

export const redisConfig = new RedisConfig();
export const redisClient = redisConfig.client;
