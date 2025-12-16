import { Router } from "express";
import { examController } from "../controllers/examController";

const router = Router() ; 

router.post("/create" , examController.createExam) ;
router.delete("/delete" , examController.deleteExam) ; 
router.get("/get" , examController.givingExamName) ; 

export const examRoutes = router ;