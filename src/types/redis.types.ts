
export interface RedisInstanceConfig {
    type: 1 | 2; // 1 for individual fields, 2 for URL
    url?: string;
    username?: string; 
    password?: string; 
    email?: string; 
    host?: string; 
    port?: number; 
    isDynamic?: boolean;
}
