import { Redis } from '@upstash/redis'
import { UPSTASH_REDIS_REST_TOKEN_CACHING, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_URL_CACHING } from '../config/env';

class ReddisConfigForCaching {
    private reddisAnalytics : any ; 
    private reddisTestData : any ; 
    constructor(){
      this.reddisAnalytics = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_URL,
})  
     
      this.reddisTestData  = new Redis({
        url : UPSTASH_REDIS_REST_URL_CACHING , 
        token : UPSTASH_REDIS_REST_TOKEN_CACHING
      })

    }


    async settingAnanlyticsData(key : any , data : any){
        try {
           await this.reddisAnalytics.set(key , data) ; 
        }
        catch(err : any){
            throw err ; 
        }
    }


    async gettingAnanlyticsData(key : any){
        try {
           const data = await this.reddisAnalytics.get(key) ; 
           return data ; 
        }
        catch(err : any){
            throw err ; 
        }
    }

     async deletingAnanlyticsData(key: string): Promise<void> {
        try {
            await this.reddisAnalytics.del(key);
        } catch (err) {
            throw err;
        }
    }


    async settingTestData(key : any , data : any) {
        try {
           await this.reddisTestData.set(key , data) ; 
        }
        catch(err : any){
            throw err ; 
        }
    }

    
    async gettingTestData(key : any){
        try {
           const data = await this.reddisTestData.get(key) ; 
           return data ; 
        }
        catch(err : any){
            throw err ; 
        }
    }

     async deletingTestData(key: string): Promise<void> {
        try {
            await this.reddisTestData.del(key);
        } catch (err) {
            throw err;
        }
    }
}



export const reddisConfigForCaching = new ReddisConfigForCaching() ; 