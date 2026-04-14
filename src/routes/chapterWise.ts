import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { chapterWiseController } from "../controllers/chapterWiseController";

const router = Router() ; 



router.get("/group" , authMiddleware , chapterWiseController.groupName) ; 
router.get("/group/chapters" , authMiddleware , chapterWiseController.getChaptersByGroups) ; 

// API #3
router.get("/:chapterId/info", authMiddleware, chapterWiseController.getChapterInfo);



// API #5
router.get("/questions/:questionId/attempts", authMiddleware, chapterWiseController.getQuestionAttemptsHistory);



// API #7
router.put("/questions/:questionId/update", authMiddleware, chapterWiseController.updateTimeSpentStatus);

// API #8
router.post("/questions/:questionId/submit", authMiddleware, chapterWiseController.submitImmediateEvaluate);


export const chapterWiseRoutes = router ;