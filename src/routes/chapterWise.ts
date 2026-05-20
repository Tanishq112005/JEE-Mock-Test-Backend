import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { chapterWiseController } from "../controllers/chapterWiseController";
import { TokenBucket } from "../middlewares/RateLimiters/tokenBucket";

const getChapterWiseQuestionLimiter = new TokenBucket('getChapterWise' , 1 , 0.25) ; 
const getAttemptsChapterWiseQuestionLimiter = new TokenBucket('getChapterWiseAttempts' , 1 , 0.25) ;  
const submitChapterWiseQuestionLimiter = new TokenBucket('submitChapterWiseAttempts' , 1 , 1) ; 
const router = Router() ; 



router.get("/group" , authMiddleware , chapterWiseController.groupName) ; 
router.get("/group/chapters" , authMiddleware , chapterWiseController.getChaptersByGroups) ; 


router.get("/:chapterName/info", authMiddleware, getChapterWiseQuestionLimiter.limit ,  chapterWiseController.getChapterInfo);


router.get("/questions/:questionId/attempts", authMiddleware, getAttemptsChapterWiseQuestionLimiter.limit ,  chapterWiseController.getQuestionAttemptsHistory);


router.put("/questions/:questionId/update", authMiddleware, chapterWiseController.updateTimeSpentStatus);


router.post("/questions/:questionId/submit", authMiddleware, submitChapterWiseQuestionLimiter.limit ,  chapterWiseController.submitImmediateEvaluate);


export const chapterWiseRoutes = router ;