"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const database_1 = require("../lib/database");
const env_1 = require("../config/env");
const google_auth_library_1 = require("google-auth-library");
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const email_producer_1 = require("../rabbitmq/producers/email-producer");
const user_db_1 = require("../repositories/user.db");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const generateOtp_1 = require("../utils/generateOtp");
const jwtToken_1 = require("../utils/jwtToken");
const password_1 = require("../utils/password");
const redis_1 = require("../lib/redis");
const redisManager_1 = __importDefault(require("../lib/redisManager")); // Fixed the import typo here
const notificationBuilder_1 = require("../interfaces/notificationBuilder");
class AuthController {
    db;
    constructor(dbClient) {
        this.db = dbClient;
    }
    createUser = async (req, res) => {
        const { name, email, password, type } = req.body;
        try {
            const hashedPassword = await (0, password_1.hashPassword)(password);
            const signinPayload = {
                name: name,
                email: email,
                password: hashedPassword,
                type: type,
            };
            const checkingUserPresent = await user_db_1.user.checkingUserPresent(email);
            if (checkingUserPresent && checkingUserPresent.is_verified) {
                return res.status(409).json(new ApiError_1.default("User already exists"));
            }
            if (!checkingUserPresent) {
                const creatingUser = await user_db_1.user.creatingUser(signinPayload);
            }
            const otp = (0, generateOtp_1.random6digitnumber)();
            const redis_key = redis_1.redisConfig.getRedisEmailKey(email);
            const otp_expire_time = Number(env_1.OTP_EXPIRE_TIME) || 300;
            const payload = (new notificationBuilder_1.NotificationBuilder()).setToEmail(email)
                .setSubject("Verify Account")
                .setContent(`Your verification OTP is ${otp} and it will expire after ${otp_expire_time / 60} minutes`).setType(client_1.NotificationTypes.VerificationEmail).build();
            await email_producer_1.emailProducer.send(payload);
            // 1. Get the correct Redis Auth instance for this specific email
            const redisClient = redisManager_1.default.getAuthRedis(email);
            console.log(`4. Saving to Redis Node [${redisManager_1.default.authRing.getNodeConfig(email)?.host}]...`);
            // 2. Use setEx for modern node-redis syntax
            await redisClient.setEx(redis_key, otp_expire_time, String(otp));
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
            // Fetch the specific Redis instance assigned to this email
            const redisClient = redisManager_1.default.getAuthRedis(email);
            const storedOtp = await redisClient.get(key);
            if (!storedOtp || storedOtp !== String(otp)) {
                return res.status(404).json(new ApiError_1.default("OTP is expired or invalid"));
            }
            // OTP verified, now delete it to prevent reuse
            await redisClient.del(key);
            await user_db_1.user.changingIsVerifiedStatus(email);
            const informationOfUser = await user_db_1.user.checkingUserPresent(email);
            // creating the student right now always
            await user_db_1.user.creatingStudent(informationOfUser.id);
            const payload = {
                id: informationOfUser.id,
                email: informationOfUser.email,
                name: informationOfUser.name,
                type: informationOfUser.type,
            };
            const accessToken = (0, jwtToken_1.generateAccessToken)(payload);
            const refreshToken = (0, jwtToken_1.generateRefershToken)({ id: informationOfUser.id }, "1d");
            await user_db_1.user.updateRefershToken(email, refreshToken);
            const isProduction = process.env.NODE_ENV === "production";
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
            });
            return res.status(200).json(new ApiResponse_1.default("Account verified and logged in successfully", {
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
            // Fetch the correct Redis instance
            const redisClient = redisManager_1.default.getAuthRedis(email);
            const storedOtp = await redisClient.get(key);
            if (!storedOtp || storedOtp !== String(otp)) {
                return res.status(400).json(new ApiError_1.default("OTP is expired or invalid"));
            }
            // Delete OTP after successful verification
            await redisClient.del(key);
            const userDetails = await user_db_1.user.userDetails(email);
            if (!userDetails) {
                return res.status(404).json(new ApiError_1.default("User account not found"));
            }
            const payload = {
                id: userDetails.id,
                name: userDetails.name,
                email: userDetails.email,
                type: userDetails.type,
            };
            const accessToken = (0, jwtToken_1.generateAccessToken)(payload);
            return res.status(200).json(new ApiResponse_1.default("Your Password is Changed, Please Login Again", {
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
                const payload = (new notificationBuilder_1.NotificationBuilder()).setToEmail(email)
                    .setSubject("Forgot Password OTP")
                    .setContent(`OTP To Reset Password is ${otp}, it will expire after ${otp_expire_time / 60} minutes`).setType(client_1.NotificationTypes.ForgotPassword)
                    .build();
                await email_producer_1.emailProducer.send(payload);
                // Fetch the correct Redis instance
                const redisClient = redisManager_1.default.getAuthRedis(email);
                await redisClient.setEx(redis_key, otp_expire_time, String(otp));
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
            const accessToken = req.headers["authorization"]?.split(" ")[1];
            let originalUserId = req.user;
            if (accessToken) {
                const { verifyAccessToken } = require("../utils/jwtToken");
                const decoded = verifyAccessToken(accessToken);
                if (decoded && decoded.id) {
                    originalUserId = decoded.id;
                }
            }
            const userId = originalUserId;
            console.log("DEBUG: passwordChange: req.userId =", req.userId, "req.user =", req.user, "final userId =", userId);
            const userDetails = await user_db_1.user.userDetailsThroughId(userId);
            if (!userDetails) {
                return res
                    .status(404)
                    .json(new ApiError_1.default("User not found during password change."));
            }
            const hashedPassword = await (0, password_1.hashPassword)(password);
            await user_db_1.user.updatePassword(userId, hashedPassword);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Password is changed successfully. Please log in again."));
        }
        catch (err) {
            return res
                .status(404)
                .json(new ApiError_1.default("Error in changing the password", err));
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
                type: userdetails.type,
            };
            const jwtPayloadRefershToken = {
                id: userId,
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
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
            });
            return res.status(200).json(new ApiResponse_1.default("User is found, and successfully logged in", {
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
                return res.status(401).json(new ApiError_1.default("Refresh Token is incorrect"));
            }
            const newAccessToken = (0, jwtToken_1.generateAccessToken)({
                id: userId,
                name: userDetails.name,
                email: userDetails.email,
                type: userDetails.type,
            });
            return res.status(200).json(new ApiResponse_1.default("Access token refreshed", {
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
    googleLogin = async (req, res) => {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json(new ApiError_1.default("idToken is required"));
        }
        try {
            const client = new google_auth_library_1.OAuth2Client(env_1.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken,
                audience: env_1.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                return res.status(400).json(new ApiError_1.default("Invalid Google token payload"));
            }
            const { email, name, email_verified } = payload;
            if (!email || !email_verified) {
                return res.status(400).json(new ApiError_1.default("Google email not verified or missing"));
            }
            let informationOfUser = await user_db_1.user.checkingUserPresent(email);
            if (!informationOfUser) {
                // User does not exist, create a new one with random dummy password
                const randomPassword = crypto_1.default.randomBytes(16).toString("hex");
                const hashedPassword = await (0, password_1.hashPassword)(randomPassword);
                const signinPayload = {
                    name: name || "User",
                    email: email,
                    password: hashedPassword,
                    type: "Student",
                };
                await user_db_1.user.creatingUser(signinPayload);
                // creatingUser sets is_verified to false by default, so we immediately set it to true
                await user_db_1.user.changingIsVerifiedStatus(email);
                informationOfUser = await user_db_1.user.checkingUserPresent(email);
                if (informationOfUser) {
                    await user_db_1.user.creatingStudent(informationOfUser.id);
                }
            }
            else if (!informationOfUser.is_verified) {
                // User exists but is not verified (started manual signup but didn't finish)
                await user_db_1.user.changingIsVerifiedStatus(email);
                await user_db_1.user.creatingStudent(informationOfUser.id);
                informationOfUser.is_verified = true;
            }
            if (!informationOfUser) {
                return res.status(500).json(new ApiError_1.default("Failed to fetch or create user"));
            }
            // Generate JWTs
            const jwtPayload = {
                id: informationOfUser.id,
                email: informationOfUser.email,
                name: informationOfUser.name,
                type: informationOfUser.type,
            };
            const accessToken = (0, jwtToken_1.generateAccessToken)(jwtPayload);
            const refreshToken = (0, jwtToken_1.generateRefershToken)({ id: informationOfUser.id }, "1d");
            await user_db_1.user.updateRefershToken(email, refreshToken);
            const isProduction = process.env.NODE_ENV === "production";
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
            });
            return res.status(200).json(new ApiResponse_1.default("Logged in successfully with Google", {
                accessToken,
            }));
        }
        catch (err) {
            console.error("Google Auth Error:", err);
            return res.status(500).json(new ApiError_1.default("Error verifying Google Token", err));
        }
    };
    logout = async (req, res) => {
        try {
            const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
            // 1. If a token exists, find the user and remove it from the database
            if (incomingRefreshToken) {
                try {
                    const decoded = await (0, jwtToken_1.verifiyingRefeshToken)(incomingRefreshToken);
                    if (decoded && decoded.id) {
                        const userDetails = await user_db_1.user.userDetailsThroughId(decoded.id);
                        if (userDetails) {
                            // Pass null or an empty string depending on your Prisma schema requirements
                            await user_db_1.user.updateRefershToken(userDetails.email, "");
                        }
                    }
                }
                catch (tokenError) {
                    // If the token is already expired or invalid, we can safely ignore the error
                    // and proceed to clean the client's cookies anyway.
                    console.log("Token invalid/expired during logout process.");
                }
            }
            // 2. Clear the cookie from the browser
            // CRITICAL: The options passed to clearCookie must exactly match the options 
            // used when the cookie was originally set in the login method (except for maxAge).
            const isProduction = process.env.NODE_ENV === "production";
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                path: "/",
            });
            // 3. Return a successful response
            return res
                .status(200)
                .json(new ApiResponse_1.default("User logged out successfully"));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error occurred during logout", err));
        }
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController(database_1.database);
