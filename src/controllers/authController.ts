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

   private db: PrismaClient | any; 
   private redis: Redis; 


   constructor(dbClient: PrismaClient | any){ 
        this.db = dbClient;
        
        const redisPort = REDIS_PORT ? parseInt(REDIS_PORT, 10) : undefined;

        this.redis = new Redis({
         port: redisPort,  
         host: REDIS_HOST
        });

      
        this.redis.on('error', (err) => {
            console.error('🚨 IORedis Connection Error:', err);
        });
   }
   
 
   async getReddisKey(email: string) {
      return `OTP:${email}`
   }


  
   async createUser(req: any , res: any){
       const {name , email , password} = req.body   ; 

      try {
       const signinPayload: userSignInputDetails = {
         name: name , 
         email: email , 
         password: password
       }
       
        const checkingUserPresent = await user.checkingUserPresent(email) ;
          if(checkingUserPresent && checkingUserPresent.is_verified){
            return res.status(200).json(
               new ApiResponse(
                  "user is already exists" 
               )
            )
         }
         if(!checkingUserPresent){
        const creatingUser = await user.creatingUser(signinPayload) ; 
         }
         
        const otp = random6digitnumber() ; 
        const redis_key = await this.getReddisKey(email) ; 
        const  otp_expire_time = Number(OTP_EXPIRE_TIME) || 300 ; 
        const paylod: email_data = {
         email_to: email ,
         subject: "Verify Account OTP" , 
         content: `Your verification OTP is ${otp} and it will expire after ${otp_expire_time / 60} minutes` 
      }
        
        await emailProducer.sendOtp(paylod) ; 
    
        await this.redis.set(redis_key, otp, 'EX', otp_expire_time);
         
        return res.status(200).json(
         new ApiResponse(
            "OTP is Sent Successfully"
         )
        )
   }catch(err: any){
         return res.status(500).json(
             new ApiError(
                "Error in user creation or sending the OTP",
                err
            )
        )
      }
   }
   
   async verifyOtp(req: any , res: any){
      const {email , otp} = req.body ; 

      try {
        const key = await this.getReddisKey(email) ; 
        const storedOtp = await this.redis.get(key) ; 
        
        if(!storedOtp){
         return res.status(400).json(
            new ApiResponse(
               "OTP is expired or invalid" 
            )
         )
        }
        
        if(storedOtp == otp){
         await this.redis.del(key);
         await user.changingIsVerifiedStatus(email) ; 
         const informationOfUser: any = await user.checkingUserPresent(email) ; 
         
       
         const payload: jwtPayload = {
            id: informationOfUser.id , 
            name: informationOfUser.name ,
            email: informationOfUser.email 
         }
         
         const token: string = generateAccessToken(payload) ; 
         await user.updateAccessToken(email , token) ;
         
         return res.status(200).json(
            new ApiResponse(
               "Access token created successfully and user verified" , 
               { token: token } 
            )
         ) 
        }

        return res.status(401).json( 
         new ApiError(
            "Your OTP is incorrect" 
         )
        )

      }
      catch(err: any){
          return res.status(500).json(
            new ApiError(
               "Error in verifying the OTP" ,
               err
            )
          )
      }
   }

}



export const authController = new AuthController(database) 



authController.createUser = authController.createUser.bind(authController) ; 
authController.verifyOtp = authController.verifyOtp.bind(authController) ;