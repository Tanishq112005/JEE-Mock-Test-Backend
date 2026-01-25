import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { developerRoleMiddleware } from "../middlewares/developerRole";
import { chapterController } from "../controllers/chapterController";

const router = Router() ; 

router.post("/create" ,authMiddleware , developerRoleMiddleware ,  chapterController.addingChapter) ; 
router.delete("/delete" ,authMiddleware , developerRoleMiddleware ,  chapterController.deletingChapter) ; 
router.get("/get" ,authMiddleware ,  chapterController.getChapters) ; 
router.get("/group" , authMiddleware , chapterController.groupName) ; 

export const chapterRoutes = router ; 