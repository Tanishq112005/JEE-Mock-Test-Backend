import { REDIS_HOST, REDIS_PORT } from "../config/env";
import Redis from "ioredis";

class RedisConfig {
    
    private redis : Redis | null = null  ; 
    constructor(){}

    async connect(){
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

    
}


export const redis = new RedisConfig() ; 