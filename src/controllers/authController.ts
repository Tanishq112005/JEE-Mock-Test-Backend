import { database } from "../lib/database";
import { OTP_EXPIRE_TIME } from "../config/env";
import { PrismaClient } from "@prisma/client";
import { emailProducer } from "../rabbitmq/producers/email-producer";
import { user } from "../repositories/user.db";
import { email_data } from "../types/email.worker.types";
import { jwtPayload } from "../types/jwt.types";
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
import { redisConfig, redisClient } from "../lib/redis";

export class AuthController {
  private db: PrismaClient | any;
  private redis: any;

  constructor(dbClient: PrismaClient | any) {
    this.db = dbClient;
    this.redis = redisClient;
  }

  public createUser = async (req: any, res: any) => {
    const { name, email, password } = req.body;

    try {
      const hashedPassword: string = await hashPassword(password);
      const signinPayload: userSignInputDetails = {
        name: name,
        email: email,
        password: hashedPassword,
      };

      const checkingUserPresent = await user.checkingUserPresent(email);
      if (checkingUserPresent && checkingUserPresent.is_verified) {
        return res.status(409).json(new ApiError("user is already exists"));
      }
      if (!checkingUserPresent) {
        const creatingUser = await user.creatingUser(signinPayload);
      }

      const otp = random6digitnumber();
      const redis_key = redisConfig.getRedisEmailKey(email);
      const otp_expire_time = Number(OTP_EXPIRE_TIME) || 300;
      const paylod: email_data = {
        email_to: email,
        subject: "Verify Account",
        content: `Your verification OTP is ${otp} and it will expire after ${
          otp_expire_time / 60
        } minutes`,
      };

      await emailProducer.sendOtp(paylod);
      if (!this.redis) {
        console.log("reddis client is missing") ; 
        res.status(404).json(new ApiError("redis client is missing "));
      }
      console.log("4. Saving to Redis...");
      await this.redis.set(redis_key, otp, "EX", otp_expire_time);
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
      const storedOtp = await this.redis.get(key);

      if (!storedOtp || storedOtp !== String(otp)) {
        return res.status(404).json(new ApiError("OTP is expired or invalid"));
      }

      await this.redis.del(key);

      await user.changingIsVerifiedStatus(email);
      const informationOfUser: any = await user.checkingUserPresent(email);

      const payload: jwtPayload = { id: informationOfUser.id };
      const accessToken: string = generateAccessToken(payload);
      const refreshToken = generateRefershToken(payload, "1d");

      await user.updateRefershToken(email, refreshToken);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res
        .status(200)
        .json(
          new ApiResponse("Account verified and logged in successfully", {
            accessToken: accessToken,
          })
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
      const storedOtp = await this.redis.get(key);

      if (!storedOtp || storedOtp !== String(otp)) {
        return res.status(400).json(new ApiError("OTP is expired or invalid"));
      }

      await this.redis.del(key);

      const userDetails = await user.userDetails(email);

      if (!userDetails) {
        return res.status(404).json(new ApiError("User account not found"));
      }

      const payload: jwtPayload = { id: userDetails.id };
      const accessToken: string = generateAccessToken(payload);

      return res
        .status(200)
        .json(
          new ApiResponse("Your Password is Changed , Please Login Again", {
            accessToken: accessToken,
          })
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
        const payload: email_data = {
          email_to: email,
          subject: "Forgot Password OTP",
          content: `OTP To Reset Password is ${otp} , it will expiry after ${
            otp_expire_time / 60
          } minutes`,
        };

        await emailProducer.sendOtp(payload);
        await this.redis.set(redis_key, otp, "EX", otp_expire_time);
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            "If an account exists, a code has been sent to your email."
          )
        );
    } catch (err: any) {
      return res
        .status(404)
        .json(
          new ApiError("Error in sending the otp for the forgotPassword", err)
        );
    }
  };

  public forgotPasswordChange = async (req: any, res: any) => {
    const { password } = req.body;
    try {
      const userId = req.user;

      const userDetails = await user.userDetailsThroughId(userId);
      if (!userDetails) {
        return res
          .status(404)
          .json(new ApiError("User not found during password change."));
      }

      const hashedPassword: string = await hashPassword(password);
      await user.updatePassword(userId, hashedPassword);

      const newDummyRefreshToken = generateRefershToken({ id: userId }, "1d");

      await user.updateRefershToken(userDetails.email, newDummyRefreshToken);

      res.clearCookie("refreshToken");

      return res.status(200).json(
        new ApiResponse(
          "Password is changed successfully. Please log in again." // IMPORTANT: Force re-login
        )
      );
    } catch (err: any) {
      return res
        .status(404)
        .json(new ApiError("Error in changing the password"));
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

      const jwtPayload: jwtPayload = {
        id: userId,
      };

      const accessToken: string = generateAccessToken(jwtPayload);
      var refreshToken;
      if (remberMe) {
        refreshToken = generateRefershToken(jwtPayload, "30d");
      } else {
        refreshToken = generateRefershToken(jwtPayload, "1d");
      }

      await user.updateRefershToken(email, refreshToken);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      return res
        .status(200)
        .json(
          new ApiResponse("User is found , and successfully login", {
            accessToken: accessToken,
          })
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in verifying the user", err));
    }
  };

  public refershToken = async (req: any, res: any) => {
    
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

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
        return res
          .status(401)
          .json(new ApiError("Refersh Token is inncorrect"));
      }

      const newAccessToken = generateAccessToken({ id: userId });
      const newRefreshToken = generateRefershToken({id : userId}, "30d");

      await user.updateRefershToken(userDetails.email, newRefreshToken);

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res
        .status(200)
        .json(
          new ApiResponse("Access token refreshed", {
            accessToken: newAccessToken,
          })
        );
    } catch (err: any) {
      res.clearCookie("refreshToken");
      return res
        .status(401)
        .json(new ApiError("Session expired. Please login again.", err));
    }
  };
}

export const authController = new AuthController(database);
