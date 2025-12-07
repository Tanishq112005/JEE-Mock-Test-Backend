import { database } from "../config/database";
import { OTP_EXPIRE_TIME, REDIS_HOST, REDIS_PORT } from "../config/env";
import { PrismaClient } from "../prisma/generated/prisma/client";
import { emailProducer } from "../rabbitmq/producers/email-producer";
import { user } from "../repositories/user.db";
import { email_data } from "../types/email.worker.types";
import { jwtPayload } from "../types/jwt.types";
import { userDetails, userSignInputDetails } from "../types/user.types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { random6digitnumber } from "../utils/generateOtp";
import { generateAccessToken } from "../utils/jwtToken";
import { Redis } from "ioredis";

export class AuthController {
   private db: PrismaClient | null ;
   private redis : any; 
   constructor(db : any){
        this.db = db 
        this.redis = new Redis({
         port :  REDIS_PORT ? parseInt(REDIS_PORT, 10) : undefined ,  
         host : REDIS_HOST
        })
   }
   
   // creating the redis key 
   async getReddisKey(email : string) {
      return `OTP:${email}`
   }


   // creating the user 
   async createUser(req : any , res : any){
       const {name , email , password} = req.body   ; 

      try {
       const signinPayload : userSignInputDetails = {
         name : name , 
         email : email , 
         password : password
       }
        const checkingUserPresent = await user.checkingUserPresent(email) ;
        const creatingUser = await user.creatingUser(signinPayload) ; 
        const otp = random6digitnumber() ; 
        const redis_key = this.getReddisKey(email) ; 

        const paylod : email_data = {
         email_to : email ,
         subject : "Reset Password" ,
         content : `Your Password Changing OTP is ${otp} and it will expiry after 10 minutes` 
      }
        await emailProducer.sendOtp(paylod) ; 
        await this.redis.set(redis_key, otp, 'EX', OTP_EXPIRE_TIME);
         
        return res.status(200).json(
         new ApiResponse(
            "OTP is Sent Successfully"
         )
        )
   }catch(err : any){
         return new ApiError(
            "Error in creation or sending the otp" , 
            err 
         )
      }
   }
   
   async verifyOtp(req : any , res : any){
      const {email , otp} = req.body ; 

      try {
        const key = this.getReddisKey(email) ; 
        const storedOtp = await this.redis.get(key) ; 
        if(!storedOtp){
         return res.status(200).json(
            new ApiResponse(
               "Otp is expired" 
            )
         )
        }
        
        if(storedOtp == otp){
         await this.redis.del(key);
         await user.changingIsVerifiedStatus(email) ; 
         const informationOfUser : userDetails = await user.checkingUserPresent(email) ; 
         const payload : jwtPayload = {
            id : informationOfUser.id , 
            name : informationOfUser.name ,
            email : informationOfUser.email 
         }
         const token : string = generateAccessToken(payload) ; 
         await user.updateAccessToken(email , token) ;
         return res.status(200).json(
            new ApiResponse(
               "access token is created successfully" , 
               token
            )
         ) 
        }

        return res.status(404).json(
         new ApiError(
            "Your Otp is worng" 
         )
        )

      }
      catch(err : any){
          return res.status(500).json(
            new ApiError(
               "Error in verifying the otp" ,
               err
            )
          )
      }
   }

}



export const authController = new AuthController({
   db : database 
}) 



authController.createUser = authController.createUser.bind(authController) ; 
authController.verifyOtp = authController.verifyOtp.bind(authController) ;