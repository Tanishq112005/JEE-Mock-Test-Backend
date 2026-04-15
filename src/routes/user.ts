import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { userController } from "../controllers/userController";

const router = Router() ; 

router.get('/get' , authMiddleware , userController.studentProfile ) ;

router.post('/stage1' , authMiddleware , userController.stage1) ; 

router.post('/stage2' , authMiddleware , userController.stage2) ; 

router.post('/stage3' , authMiddleware , userController.stage3) ;

router.get('/stageNumber' , authMiddleware , userController.stageNumber) ;


router.post('/update' , authMiddleware , userController.updateData ) ; 



export const userRoutes = router;