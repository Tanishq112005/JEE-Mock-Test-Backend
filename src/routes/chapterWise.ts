import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { chapterWiseController } from "../controllers/chapterWiseController";

const router = Router() ; 



router.get("/group" , authMiddleware , chapterWiseController.groupName) ; 
router.get("/group/chapters" , authMiddleware , chapterWiseController.getChaptersByGroups) ; 


router.get("/:chapterName/info", authMiddleware, chapterWiseController.getChapterInfo);




router.get("/questions/:questionId/attempts", authMiddleware, chapterWiseController.getQuestionAttemptsHistory);


router.put("/questions/:questionId/update", authMiddleware, chapterWiseController.updateTimeSpentStatus);


router.post("/questions/:questionId/submit", authMiddleware, chapterWiseController.submitImmediateEvaluate);


export const chapterWiseRoutes = router ;