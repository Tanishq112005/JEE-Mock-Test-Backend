import { Router } from "express";
import { examController } from "../controllers/examController";
import { authMiddleware } from "../middlewares/auth";
import { developerRoleMiddleware } from "../middlewares/developerRole";

const router = Router() ; 

router.post("/create" ,authMiddleware , developerRoleMiddleware ,  examController.createExam) ;
router.delete("/delete" ,authMiddleware , developerRoleMiddleware ,  examController.deleteExam) ; 
router.get("/get" ,authMiddleware , developerRoleMiddleware ,  examController.givingExamName) ; 

export const examRoutes = router ;