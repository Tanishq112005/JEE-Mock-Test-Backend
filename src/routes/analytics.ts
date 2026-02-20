import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController";
import { authMiddleware } from "../middlewares/auth";

const router = Router() ; 

router.get("/dashboard" ,authMiddleware ,  analyticsController.studentReport) ;

router.get("/analyticsWindow" , authMiddleware , analyticsController.analyticsData) ; 

router.get("/test" ,authMiddleware ,  analyticsController.testAnalytics) ; 


export const analyticsRoutes = router ; 