import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();


router.post("/signup" , authController.createUser) ; 
router.post("/verifyOTP" , authController.verifyOtp) ; 
router.post("/passwordChange" ,authMiddleware ,  authController.forgotPasswordChange) ; 
router.post("/passwordEmailVerification" , authController.forgotPasswordVerification)
router.post("/login" , authController.verifyUser) ; 


export const authRoutes = router ; 
