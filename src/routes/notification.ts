import { Router } from "express";
import { notificationController } from "../controllers/notificationController";
import { developerRoleMiddleware } from "../middlewares/developerRole";
import { authMiddleware } from "../middlewares/auth";

const router = Router() ; 


router.post('/sendingMailToParticularUser' ,authMiddleware , developerRoleMiddleware ,  notificationController.sendingEmailParticularUser) ;
router.post('/sendingEmailToAll' , authMiddleware ,developerRoleMiddleware , notificationController.sendingEmailToAllUser) ;
router.post('/sendEmailToSupport' , authMiddleware , notificationController.emailToSupport) ; 


export const notificationRoutes = router ; 