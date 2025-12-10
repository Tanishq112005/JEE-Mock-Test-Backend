import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";
import { RateLimiter } from "../middlewares/rateLimiter";
import { redis } from "../lib/redis"; 
import { MAX_ATTEMENTS, WINDOW_SIZE } from "../config/env";

const router = Router();

const maxAttempts = parseInt(MAX_ATTEMENTS || '3', 10);
const windowSize = parseInt(WINDOW_SIZE || '60', 10); 

const otpGenLimiter = new RateLimiter(
    redis.connect(), 
    maxAttempts, 
    windowSize, 
    'otp_gen' 
);


const signUpLimiter = new RateLimiter(
    redis.connect() , 
    maxAttempts , 
    windowSize , 
    'sigUp' 
)
const otpVerifyLimiter = new RateLimiter(
    redis.connect(), 
    maxAttempts, 
    windowSize, 
    'otp_verify'
);

const loginLimiter = new RateLimiter(
    redis.connect(), 
    5, 
    10 * 60,
    'login'
);


router.post("/signup", signUpLimiter.limit , authController.createUser);

router.post("/verifyOTP", otpVerifyLimiter.limit, authController.verifyOtp);

router.post("/login", loginLimiter.limit, authController.verifyUser);

router.post("/passwordEmailVerification", otpGenLimiter.limit, authController.forgotPasswordVerification);

router.post("/passwordChange", authMiddleware, authController.forgotPasswordChange);


export const authRoutes = router;