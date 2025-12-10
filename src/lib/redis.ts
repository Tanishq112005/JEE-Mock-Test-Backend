import { REDIS_HOST, REDIS_PORT } from "../config/env";
import Redis from "ioredis";

class RedisConfig {
    
    private redis : Redis | null = null  ; 
    constructor(){}

     connect(){
        if(this.redis){
            return this.redis ;
        }
       const redisPort = REDIS_PORT ? parseInt(REDIS_PORT, 10) : undefined;

        this.redis = new Redis({
         port: redisPort,  
         host: REDIS_HOST
        });

      
        this.redis.on('error', (err) => {
            console.error('IORedis Connection Error:', err);
        });

         return this.redis ; 
    }


     getReddisEmailKey(email : string){
         return `OTP:${email}` ; 
    }

    getReddisLimitKey(keyPrefix : string , identifier : string){
        return `rate_limit:${keyPrefix}:${identifier}`;
    }
}


export const redis = new RedisConfig() ; 
 