import { database } from "../lib/database";
import { OTP_EXPIRE_TIME } from "../config/env";
import { NotificationTypes, PrismaClient } from "@prisma/client";
import { emailProducer } from "../rabbitmq/producers/email-producer";
import { user } from "../repositories/user.db";

import {
  jwtPayloadAccessToken,
  jwtPayloadRefershToken,
} from "../types/jwt.types";
import { userDetails, userSignInputDetails } from "../types/user.types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { random6digitnumber } from "../utils/generateOtp";
import {
  generateAccessToken,
  generateRefershToken,
  verifiyingRefeshToken,
} from "../utils/jwtToken";
import { comparePasswords, hashPassword } from "../utils/password";
import { redisConfig } from "../lib/redis";
import redisManager from "../lib/redisManager"; // Fixed the import typo here
import { NotificationMessage } from "../interfaces/notificationInterface";
import { NotificationBuilder } from "../interfaces/notificationBuilder";

export class AuthController {
  private db: PrismaClient | any;

  constructor(dbClient: PrismaClient | any) {
    this.db = dbClient;
  }

  public createUser = async (req: any, res: any) => {
    const { name, email, password, type } = req.body;

    try {
      const hashedPassword: string = await hashPassword(password);
      const signinPayload: userSignInputDetails = {
        name: name,
        email: email,
        password: hashedPassword,
        type: type,
      };

      const checkingUserPresent = await user.checkingUserPresent(email);
      if (checkingUserPresent && checkingUserPresent.is_verified) {
        return res.status(409).json(new ApiError("User already exists"));
      }
      if (!checkingUserPresent) {
        const creatingUser = await user.creatingUser(signinPayload);
      }

      const otp = random6digitnumber();
      const redis_key = redisConfig.getRedisEmailKey(email);
      const otp_expire_time = Number(OTP_EXPIRE_TIME) || 300;


      const payload: NotificationMessage = (new NotificationBuilder()).setToEmail(email)
        .setSubject("Verify Account")
        .setContent(`Your verification OTP is ${otp} and it will expire after ${otp_expire_time / 60
          } minutes`).setType(NotificationTypes.VerificationEmail).build();

      await emailProducer.send(payload);

      // 1. Get the correct Redis Auth instance for this specific email
      const redisClient = redisManager.getAuthRedis(email);

      console.log(
        `4. Saving to Redis Node [${redisManager.authRing.getNodeConfig(email)?.host}]...`,
      );

      // 2. Use setEx for modern node-redis syntax
      await redisClient.setEx(redis_key, otp_expire_time, String(otp));

      console.log("5. Saved to Redis");
      return res.status(200).json(new ApiResponse("OTP is Sent Successfully"));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in user creation or sending the OTP", err));
    }
  };

  public verifySignupOtp = async (req: any, res: any) => {
    const { email, otp } = req.body;

    try {
      const key = redisConfig.getRedisEmailKey(email);

      // Fetch the specific Redis instance assigned to this email
      const redisClient = redisManager.getAuthRedis(email);
      const storedOtp = await redisClient.get(key);

      if (!storedOtp || storedOtp !== String(otp)) {
        return res.status(404).json(new ApiError("OTP is expired or invalid"));
      }

      // OTP verified, now delete it to prevent reuse
      await redisClient.del(key);

      await user.changingIsVerifiedStatus(email);
      const informationOfUser: any = await user.checkingUserPresent(email);

      // creating the student right now always
      await user.creatingStudent(informationOfUser.id);
      const payload: jwtPayloadAccessToken = {
        id: informationOfUser.id,
        email: informationOfUser.email,
        name: informationOfUser.name,
        type: informationOfUser.type,
      };
      const accessToken: string = generateAccessToken(payload);

      const refreshToken = generateRefershToken(
        { id: informationOfUser.id },
        "1d",
      );
      await user.updateRefershToken(email, refreshToken);

      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.status(200).json(
        new ApiResponse("Account verified and logged in successfully", {
          accessToken: accessToken,
        }),
      );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in verifying signup OTP", err));
    }
  };

  public verifyForgotPasswordOtp = async (req: any, res: any) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json(new ApiError("Email and OTP are required"));
    }

    try {
      const key = redisConfig.getRedisEmailKey(email);

      // Fetch the correct Redis instance
      const redisClient = redisManager.getAuthRedis(email);
      const storedOtp = await redisClient.get(key);

      if (!storedOtp || storedOtp !== String(otp)) {
        return res.status(400).json(new ApiError("OTP is expired or invalid"));
      }

      // Delete OTP after successful verification
      await redisClient.del(key);

      const userDetails = await user.userDetails(email);

      if (!userDetails) {
        return res.status(404).json(new ApiError("User account not found"));
      }

      const payload: jwtPayloadAccessToken = {
        id: userDetails.id,
        name: userDetails.name,
        email: userDetails.email,
        type: userDetails.type,
      };
      const accessToken: string = generateAccessToken(payload);

      return res.status(200).json(
        new ApiResponse("Your Password is Changed, Please Login Again", {
          accessToken: accessToken,
        }),
      );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error verifying forgot password OTP", err));
    }
  };

  public forgotPasswordVerification = async (req: any, res: any) => {
    const { email } = req.body;
    try {
      const userDetails: any = await user.checkingUserPresent(email);
      if (userDetails) {
        const otp = random6digitnumber();
        const redis_key = redisConfig.getRedisEmailKey(email);
        const otp_expire_time = Number(OTP_EXPIRE_TIME) || 300;

        const payload: NotificationMessage = (new NotificationBuilder()).setToEmail(email)
          .setSubject("Forgot Password OTP")
          .setContent(`OTP To Reset Password is ${otp}, it will expire after ${otp_expire_time / 60
            } minutes`).setType(NotificationTypes.ForgotPassword)
          .build();

        await emailProducer.send(payload);

        // Fetch the correct Redis instance
        const redisClient = redisManager.getAuthRedis(email);
        await redisClient.setEx(redis_key, otp_expire_time, String(otp));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            "If an account exists, a code has been sent to your email.",
          ),
        );
    } catch (err: any) {
      return res
        .status(404)
        .json(
          new ApiError("Error in sending the otp for the forgotPassword", err),
        );
    }
  };

  public forgotPasswordChange = async (req: any, res: any) => {
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

      console.log(
        "DEBUG: passwordChange: req.userId =",
        req.userId,
        "req.user =",
        req.user,
        "final userId =",
        userId,
      );

      const userDetails = await user.userDetailsThroughId(userId);
      if (!userDetails) {
        return res
          .status(404)
          .json(new ApiError("User not found during password change."));
      }

      const hashedPassword: string = await hashPassword(password);
      await user.updatePassword(userId, hashedPassword);

      return res
        .status(200)
        .json(
          new ApiResponse(
            "Password is changed successfully. Please log in again.",
          ),
        );
    } catch (err: any) {
      return res
        .status(404)
        .json(new ApiError("Error in changing the password", err));
    }
  };

  public login = async (req: any, res: any) => {
    const { email, password, remberMe } = req.body;
    try {
      const userdetails: userDetails | null = await user.userDetails(email);
      if (!userdetails) {
        return res.status(404).json(new ApiError("No Such user is found out"));
      }

      const valid = await comparePasswords(password, userdetails.password);
      if (!valid) {
        return res.status(404).json(new ApiError("Invalid Password"));
      }

      const userId: string = userdetails.id;

      const jwtPayloadAccessToken: jwtPayloadAccessToken = {
        id: userId,
        name: userdetails.name,
        email: userdetails.email,
        type: userdetails.type,
      };

      const jwtPayloadRefershToken: jwtPayloadRefershToken = {
        id: userId,
      };

      const accessToken: string = generateAccessToken(jwtPayloadAccessToken);
      var refreshToken;
      if (remberMe) {
        refreshToken = generateRefershToken(jwtPayloadRefershToken, "30d");
      } else {
        refreshToken = generateRefershToken(jwtPayloadRefershToken, "1d");
      }

      await user.updateRefershToken(email, refreshToken);
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      return res.status(200).json(
        new ApiResponse("User is found, and successfully logged in", {
          accessToken: accessToken,
        }),
      );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in verifying the user", err));
    }
  };

  public refershToken = async (req: any, res: any) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return res
        .status(401)
        .json(new ApiError("Unauthorized. Please login again."));
    }

    try {
      const decoded = await verifiyingRefeshToken(incomingRefreshToken);

      const userId = decoded.id;
      const userDetails = await user.userDetailsThroughId(userId);

      if (userDetails.refersh_token != incomingRefreshToken) {
        return res.status(401).json(new ApiError("Refresh Token is incorrect"));
      }

      const newAccessToken = generateAccessToken({
        id: userId,
        name: userDetails.name,
        email: userDetails.email,
        type: userDetails.type,
      });

      return res.status(200).json(
        new ApiResponse("Access token refreshed", {
          accessToken: newAccessToken,
        }),
      );
    } catch (err: any) {
      res.clearCookie("refreshToken");
      return res
        .status(401)
        .json(new ApiError("Session expired. Please login again.", err));
    }
  };

   
  public logout = async (req: any, res: any) => {
    try {
      const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

      // 1. If a token exists, find the user and remove it from the database
      if (incomingRefreshToken) {
        try {
          const decoded = await verifiyingRefeshToken(incomingRefreshToken);

          if (decoded && decoded.id) {
            const userDetails = await user.userDetailsThroughId(decoded.id);

            if (userDetails) {
              // Pass null or an empty string depending on your Prisma schema requirements
              await user.updateRefershToken(userDetails.email, ""); 
            }
          }
        } catch (tokenError) {
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
        .json(new ApiResponse("User logged out successfully"));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error occurred during logout", err));
    }
  };
  


}

export const authController = new AuthController(database);
