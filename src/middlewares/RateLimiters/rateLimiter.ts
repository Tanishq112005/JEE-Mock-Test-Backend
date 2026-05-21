// the main rateLimiter class description 
// defination of the rate limiters 

export abstract class RateLimiter {
    constructor(){
    }
    abstract limit(req: any, res: any, next: any): Promise<void> | void;
} ; 




