import { Router } from "express";
import { subjectController } from "../controllers/subjectContoller";
import { authMiddleware } from "../middlewares/auth";
import { developerRoleMiddleware } from "../middlewares/developerRole";

const router = Router() ; 

router.post("/create" ,authMiddleware , developerRoleMiddleware ,  subjectController.createSubject) ; 
router.delete("/delete" ,authMiddleware , developerRoleMiddleware ,  subjectController.deletingSubject) ; 
router.get("/get" ,authMiddleware , developerRoleMiddleware ,  subjectController.givingSubjectName) ; 


export const subjectRoutes = router ; 