import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { developerRoleMiddleware } from "../middlewares/developerRole";
import { paperController } from "../controllers/paperController";

const router = Router();


router.post("/create", authMiddleware, developerRoleMiddleware, paperController.createPaper);


router.delete("/delete/:paperId", authMiddleware, developerRoleMiddleware, paperController.deletePaper);


router.get("/get", authMiddleware,  paperController.getAllPapers);

router.post("/addMarkingScheme" , authMiddleware , developerRoleMiddleware , paperController.addingMarkingScheme) ; 


router.get("/getMarkingScheme" , authMiddleware , paperController.gettingMarkingScheme) ; 
export const paperRoutes = router;