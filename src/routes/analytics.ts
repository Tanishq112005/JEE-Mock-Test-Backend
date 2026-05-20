import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController";
import { authMiddleware } from "../middlewares/auth";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const dashboardLimiter = new TokenBucket('dashboard' , 1, 0.25);
const testAnalyticsLimiter = new TokenBucket('testAnalytics' , 1, 0.25);
const analyticsLimiter = new TokenBucket('analytics' , 1 , 0.25) ; 

const router = Router() ; 

router.get("/dashboard" ,authMiddleware ,dashboardLimiter.limit ,   analyticsController.studentReport) ;

router.get("/analyticsWindow" , authMiddleware , analyticsLimiter.limit ,  analyticsController.analyticsData) ; 

router.get("/test" ,authMiddleware , testAnalyticsLimiter.limit ,  analyticsController.testAnalytics) ; 


export const analyticsRoutes = router ; 