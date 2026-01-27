"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const database_1 = require("../lib/database");
const env_1 = require("../config/env");
const email_producer_1 = require("../rabbitmq/producers/email-producer");
const user_db_1 = require("../repositories/user.db");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const generateOtp_1 = require("../utils/generateOtp");
const jwtToken_1 = require("../utils/jwtToken");
const password_1 = require("../utils/password");
const redis_1 = require("../lib/redis");
class AuthController {
    db;
    redis;
    constructor(dbClient) {
        this.db = dbClient;
        this.redis = redis_1.redisClient;
    }
    createUser = async (req, res) => {
        const { name, email, password, type } = req.body;
        try {
            const hashedPassword = await (0, password_1.hashPassword)(password);
            const signinPayload = {
                name: name,
                email: email,
                password: hashedPassword,
                type: type
            };
            const checkingUserPresent = await user_db_1.user.checkingUserPresent(email);
            if (checkingUserPresent && checkingUserPresent.is_verified) {
                return res.status(409).json(new ApiError_1.default("user is already exists"));
            }
            if (!checkingUserPresent) {
                const creatingUser = await user_db_1.user.creatingUser(signinPayload);
            }
            const otp = (0, generateOtp_1.random6digitnumber)();
            const redis_key = redis_1.redisConfig.getRedisEmailKey(email);
            const otp_expire_time = Number(env_1.OTP_EXPIRE_TIME) || 300;
            const paylod = {
                email_to: email,
                subject: "Verify Account",
                content: `Your verification OTP is ${otp} and it will expire after ${otp_expire_time / 60} minutes`,
            };
            await email_producer_1.emailProducer.sendOtp(paylod);
            if (!this.redis) {
                console.log("reddis client is missing");
                res.status(404).json(new ApiError_1.default("redis client is missing "));
            }
            console.log("4. Saving to Redis...");
            await this.redis.set(redis_key, otp, "EX", otp_expire_time);
            console.log("5. Saved to Redis");
            return res.status(200).json(new ApiResponse_1.default("OTP is Sent Successfully"));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in user creation or sending the OTP", err));
        }
    };
    verifySignupOtp = async (req, res) => {
        const { email, otp } = req.body;
        try {
            const key = redis_1.redisConfig.getRedisEmailKey(email);
            const storedOtp = await this.redis.get(key);
            if (!storedOtp || storedOtp !== String(otp)) {
                return res.status(404).json(new ApiError_1.default("OTP is expired or invalid"));
            }
            await this.redis.del(key);
            await user_db_1.user.changingIsVerifiedStatus(email);
            const informationOfUser = await user_db_1.user.checkingUserPresent(email);
            const payload = { id: informationOfUser.id, email: informationOfUser.email, name: informationOfUser.name, type: informationOfUser.type };
            const accessToken = (0, jwtToken_1.generateAccessToken)(payload);
            const refreshToken = (0, jwtToken_1.generateRefershToken)({ id: informationOfUser.id }, "1d");
            ;
            await user_db_1.user.updateRefershToken(email, refreshToken);
            const isProduction = process.env.NODE_ENV === "production";
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                // Only true in production (HTTPS). False for localhost (HTTP).
                secure: isProduction,
                // "None" requires Secure=true. Use "Lax" for localhost.
                sameSite: isProduction ? "none" : "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/" // Add this to ensure cookie works on all routes
            });
            return res
                .status(200)
                .json(new ApiResponse_1.default("Account verified and logged in successfully", {
                accessToken: accessToken,
            }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in verifying signup OTP", err));
        }
    };
    verifyForgotPasswordOtp = async (req, res) => {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json(new ApiError_1.default("Email and OTP are required"));
        }
        try {
            const key = redis_1.redisConfig.getRedisEmailKey(email);
            const storedOtp = await this.redis.get(key);
            if (!storedOtp || storedOtp !== String(otp)) {
                return res.status(400).json(new ApiError_1.default("OTP is expired or invalid"));
            }
            await this.redis.del(key);
            const userDetails = await user_db_1.user.userDetails(email);
            if (!userDetails) {
                return res.status(404).json(new ApiError_1.default("User account not found"));
            }
            const payload = { id: userDetails.id, name: userDetails.name, email: userDetails.email, type: userDetails.type };
            const accessToken = (0, jwtToken_1.generateAccessToken)(payload);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Your Password is Changed , Please Login Again", {
                accessToken: accessToken,
            }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error verifying forgot password OTP", err));
        }
    };
    forgotPasswordVerification = async (req, res) => {
        const { email } = req.body;
        try {
            const userDetails = await user_db_1.user.checkingUserPresent(email);
            if (userDetails) {
                const otp = (0, generateOtp_1.random6digitnumber)();
                const redis_key = redis_1.redisConfig.getRedisEmailKey(email);
                const otp_expire_time = Number(env_1.OTP_EXPIRE_TIME) || 300;
                const payload = {
                    email_to: email,
                    subject: "Forgot Password OTP",
                    content: `OTP To Reset Password is ${otp} , it will expiry after ${otp_expire_time / 60} minutes`,
                };
                await email_producer_1.emailProducer.sendOtp(payload);
                await this.redis.set(redis_key, otp, "EX", otp_expire_time);
            }
            return res
                .status(200)
                .json(new ApiResponse_1.default("If an account exists, a code has been sent to your email."));
        }
        catch (err) {
            return res
                .status(404)
                .json(new ApiError_1.default("Error in sending the otp for the forgotPassword", err));
        }
    };
    forgotPasswordChange = async (req, res) => {
        const { password } = req.body;
        try {
            const userId = req.user;
            const userDetails = await user_db_1.user.userDetailsThroughId(userId);
            if (!userDetails) {
                return res
                    .status(404)
                    .json(new ApiError_1.default("User not found during password change."));
            }
            const hashedPassword = await (0, password_1.hashPassword)(password);
            await user_db_1.user.updatePassword(userId, hashedPassword);
            return res.status(200).json(new ApiResponse_1.default("Password is changed successfully. Please log in again."));
        }
        catch (err) {
            return res
                .status(404)
                .json(new ApiError_1.default("Error in changing the password"));
        }
    };
    login = async (req, res) => {
        const { email, password, remberMe } = req.body;
        try {
            const userdetails = await user_db_1.user.userDetails(email);
            if (!userdetails) {
                return res.status(404).json(new ApiError_1.default("No Such user is found out"));
            }
            const valid = await (0, password_1.comparePasswords)(password, userdetails.password);
            if (!valid) {
                return res.status(404).json(new ApiError_1.default("Invalid Password"));
            }
            const userId = userdetails.id;
            const jwtPayloadAccessToken = {
                id: userId,
                name: userdetails.name,
                email: userdetails.email,
                type: userdetails.type
            };
            const jwtPayloadRefershToken = {
                id: userId
            };
            const accessToken = (0, jwtToken_1.generateAccessToken)(jwtPayloadAccessToken);
            var refreshToken;
            if (remberMe) {
                refreshToken = (0, jwtToken_1.generateRefershToken)(jwtPayloadRefershToken, "30d");
            }
            else {
                refreshToken = (0, jwtToken_1.generateRefershToken)(jwtPayloadRefershToken, "1d");
            }
            await user_db_1.user.updateRefershToken(email, refreshToken);
            const isProduction = process.env.NODE_ENV === "production";
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: isProduction, // Now this variable exists!
                sameSite: isProduction ? "none" : "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/"
            });
            return res
                .status(200)
                .json(new ApiResponse_1.default("User is found , and successfully login", {
                accessToken: accessToken,
            }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in verifying the user", err));
        }
    };
    refershToken = async (req, res) => {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!incomingRefreshToken) {
            return res
                .status(401)
                .json(new ApiError_1.default("Unauthorized. Please login again."));
        }
        try {
            const decoded = await (0, jwtToken_1.verifiyingRefeshToken)(incomingRefreshToken);
            const userId = decoded.id;
            const userDetails = await user_db_1.user.userDetailsThroughId(userId);
            if (userDetails.refersh_token != incomingRefreshToken) {
                return res
                    .status(401)
                    .json(new ApiError_1.default("Refersh Token is inncorrect"));
            }
            const newAccessToken = (0, jwtToken_1.generateAccessToken)({ id: userId, name: userDetails.name, email: userDetails.email, type: userDetails.type });
            return res
                .status(200)
                .json(new ApiResponse_1.default("Access token refreshed", {
                accessToken: newAccessToken,
            }));
        }
        catch (err) {
            res.clearCookie("refreshToken");
            return res
                .status(401)
                .json(new ApiError_1.default("Session expired. Please login again.", err));
        }
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController(database_1.database);
