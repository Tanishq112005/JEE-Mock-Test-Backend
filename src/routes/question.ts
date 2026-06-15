import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { developerRoleMiddleware } from "../middlewares/developerRole";
import { questionController } from "../controllers/questionController";

const router = Router();


router.post("/create", authMiddleware, developerRoleMiddleware, questionController.createSingleQuestion);


router.post("/uploadingPaper", authMiddleware, developerRoleMiddleware, questionController.uploadingAllQuestion);


router.delete("/delete/:questionId", authMiddleware, developerRoleMiddleware, questionController.deleteQuestion);


router.get("/get", authMiddleware, questionController.getQuestions);

router.get("/paperQuestions/:paperId" , authMiddleware , questionController.getPaperQuestions) ; 

router.post("/update" ,authMiddleware , developerRoleMiddleware , questionController.updatingQuestion) ; 


export const questionRoutes = router;