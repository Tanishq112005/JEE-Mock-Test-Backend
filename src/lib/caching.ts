import { Redis } from '@upstash/redis'

class ReddisConfigForCaching {
    private reddis : any ; 
    constructor(){
      this.reddis = Redis.fromEnv() ; 
    }


    async settingData(key : any , data : any){
        try {
           await this.reddis.set(key , data) ; 
        }
        catch(err : any){
            throw err ; 
        }
    }


    async gettingData(key : any){
        try {
           const data = await this.reddis.get(key) ; 
           return data ; 
        }
        catch(err : any){
            throw err ; 
        }
    }
}



export const reddisConfigForCaching = new ReddisConfigForCaching() ; 