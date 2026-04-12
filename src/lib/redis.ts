import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from "../config/env";
import { createClient, RedisClientType } from "redis";

class RedisConfig {
  constructor(){} 
  getRedisEmailKey(email: string) {
    return `OTP:${email}`;
  }

  getRedisLimitKey(keyPrefix: string, identifier: string) {
    return `rate_limit:${keyPrefix}:${identifier}`;
  }
}
 
export const redisConfig = new RedisConfig();
