import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";
import { SlidingWindowLog } from "../middlewares/RateLimiters/slidingWindowLog";
import { MAX_ATTEMENTS, WINDOW_SIZE } from "../config/env";
import { RateLimiter } from "../middlewares/RateLimiters/rateLimiter";
// redisClient import yahan se hata diya gaya hai!

const router = Router();

const maxAttempts = parseInt(MAX_ATTEMENTS || "3", 10);
const windowSize = parseInt(WINDOW_SIZE || "60", 10);

// Ab hum RateLimiter mein static redis pass nahi kar rahe hain
const otpGenLimiter : RateLimiter = new SlidingWindowLog(maxAttempts, windowSize, "otp_gen");

const signUpLimiter : RateLimiter = new SlidingWindowLog(maxAttempts, windowSize, "sigUp");

const otpVerifyLimiter : RateLimiter = new SlidingWindowLog(maxAttempts, windowSize, "otp_verify");

const loginLimiter : RateLimiter = new SlidingWindowLog(5, 60, "login");

router.post("/signup", signUpLimiter.limit, authController.createUser);

router.post(
  "/verifySignUpOTP",
  otpVerifyLimiter.limit,
  authController.verifySignupOtp,
);

router.post("/login", loginLimiter.limit, authController.login);

router.post(
  "/passwordEmailVerification",
  otpGenLimiter.limit,
  authController.forgotPasswordVerification,
);

router.post(
  "/passwordChange",
  authMiddleware,
  authController.forgotPasswordChange,
);

router.get("/refershToken", authController.refershToken);

router.post(
  "/verifyPasswordOTP",
  otpVerifyLimiter.limit,
  authController.verifyForgotPasswordOtp,
);

export const authRoutes = router;
