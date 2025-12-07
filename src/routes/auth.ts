import { Router } from "express";
import { authController } from "../controllers/authController";

const router = Router();


// creating the route 

router.post("/createUser" , authController.createUser) ; 
router.post("/verifyOTP" , authController.verifyOtp) ; 



export const authRoutes = router ; 
