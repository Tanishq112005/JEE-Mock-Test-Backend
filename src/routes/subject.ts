import { Router } from "express";
import { subjectController } from "../controllers/subjectContoller";

const router = Router() ; 

router.post("/create" , subjectController.createSubject) ; 
router.delete("/delete" , subjectController.deletingSubject) ; 
router.get("/get" , subjectController.givingSubjectName) ; 


export const subjectRoutes = router ; 