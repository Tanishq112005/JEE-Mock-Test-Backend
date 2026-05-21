// the main rateLimiter class description 
// defination of the rate limiters 

export interface RateLimiter {
    
     limit(req: any, res: any, next: any): Promise<void> | void;
} ; 




