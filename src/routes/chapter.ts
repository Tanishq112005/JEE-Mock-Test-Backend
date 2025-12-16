import { Router } from "express";
import { chapter } from "../repositories/chapter.db";
import { authMiddleware } from "../middlewares/auth";
import { developerRoleMiddleware } from "../middlewares/developerRole";

const router = Router() ; 

router.post("/create" ,authMiddleware , developerRoleMiddleware ,  chapter.addingChapter) ; 
router.delete("/delete" ,authMiddleware , developerRoleMiddleware ,  chapter.deletingChapter) ; 
router.get("/get" ,authMiddleware , developerRoleMiddleware ,  chapter.gettingChapter) ; 

export const chapterRoutes = router ; 