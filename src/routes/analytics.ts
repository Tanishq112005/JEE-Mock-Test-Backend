import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController";
import { authMiddleware } from "../middlewares/auth";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const dashboardLimiter = new TokenBucket(1, 0.8);
const testAnalyticsLimiter = new TokenBucket(1, 0.8);
const analyticsLimiter = new TokenBucket(1 , 0.8) ; 

const router = Router() ; 

router.get("/dashboard" ,authMiddleware ,dashboardLimiter.limit ,   analyticsController.studentReport) ;

router.get("/analyticsWindow" , authMiddleware , analyticsLimiter.limit ,  analyticsController.analyticsData) ; 

router.get("/test" ,authMiddleware , testAnalyticsLimiter.limit ,  analyticsController.testAnalytics) ; 


export const analyticsRoutes = router ; 