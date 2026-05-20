"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const slidingWindowLog_1 = require("../middlewares/RateLimiters/slidingWindowLog");
const env_1 = require("../config/env");
// redisClient import yahan se hata diya gaya hai!
const router = (0, express_1.Router)();
const maxAttempts = parseInt(env_1.MAX_ATTEMENTS || "3", 10);
const windowSize = parseInt(env_1.WINDOW_SIZE || "60", 10);
// Ab hum RateLimiter mein static redis pass nahi kar rahe hain
const otpGenLimiter = new slidingWindowLog_1.SlidingWindowLog(maxAttempts, windowSize, "otp_gen");
const signUpLimiter = new slidingWindowLog_1.SlidingWindowLog(maxAttempts, windowSize, "sigUp");
const otpVerifyLimiter = new slidingWindowLog_1.SlidingWindowLog(maxAttempts, windowSize, "otp_verify");
const loginLimiter = new slidingWindowLog_1.SlidingWindowLog(5, 60, "login");
router.post("/signup", signUpLimiter.limit, authController_1.authController.createUser);
router.post("/verifySignUpOTP", otpVerifyLimiter.limit, authController_1.authController.verifySignupOtp);
router.post("/login", loginLimiter.limit, authController_1.authController.login);
router.post("/passwordEmailVerification", otpGenLimiter.limit, authController_1.authController.forgotPasswordVerification);
router.post("/passwordChange", auth_1.authMiddleware, authController_1.authController.forgotPasswordChange);
router.get("/refershToken", authController_1.authController.refershToken);
router.post("/verifyPasswordOTP", otpVerifyLimiter.limit, authController_1.authController.verifyForgotPasswordOtp);
exports.authRoutes = router;
