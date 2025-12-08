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
import { generateAccessToken} from "../utils/jwtToken";
import { Redis } from "ioredis";
import { comparePasswords, hashPassword } from "../utils/password";



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
            console.error('IORedis Connection Error:', err);
        });
   }
   
 
   async getReddisKey(email: string) {
      return `OTP:${email}`
   }


  
   async createUser(req: any , res: any){
       const {name , email , password} = req.body   ; 

      try {
       const hashedPassword : string = await hashPassword(password) ;   
       const signinPayload: userSignInputDetails = {
         name: name , 
         email: email , 
         password: hashedPassword
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
         subject: "Verify Account" , 
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
            id: informationOfUser.id 
         }
         
         const token: string = generateAccessToken(payload) ; 
         await user.updateAccessToken(email , token) ;
         
         return res.status(200).json(
            new ApiResponse(
               "Access token created successfully and user verified" , 
               { accessToken: token } 
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
   

   async forgotPasswordVerification(req : any , res : any){
       const {email} = req.body ; 
      try {
         const userDetails : any = await user.checkingUserPresent(email) ; 
         if(userDetails){
           
         
            const otp  = random6digitnumber() ; 
            const redis_key = await this.getReddisKey(email) ; 
            const  otp_expire_time = Number(OTP_EXPIRE_TIME) || 300 ; 
            const payload : email_data = {
               email_to : email , 
               subject : "Forgot Password OTP" ,
               content : `OTP To Reset Password is ${otp} , it will expiry after ${otp_expire_time/60}`
            }

            await emailProducer.sendOtp(payload) ; 
            await this.redis.set(redis_key, otp, 'EX', otp_expire_time);
         }  
         
         return res.status(200).json(
            new ApiResponse("If an account exists, a code has been sent to your email.")  
         )
      }
      catch(err : any){
          return res.status(404).json(
            new ApiError("Error in sending the otp for the forgotPassword" , err)  
          )
      }
   }

   async forgotPasswordChange(req : any , res : any){
      const {userId ,  password} = req.body ; 
      try {
         const hashedPassword : string = await hashPassword(password) ; 
         await user.updatePassword(userId , hashedPassword) ; 
         return res.status(200).json(
            new ApiResponse(
               "Password is changed successfully , you can login again"
            )
         ) 
      }
      catch(err : any){
         return res.status(404).json(
            new ApiError("Error in chaning the password")  
         )
      }
   }

   

   async verifyUser(req : any , res : any){
      const {email , password} = req.body ; 
      try {
         const userdetails : userDetails | null = await user.userDetails(email ) ; 
         if(!userdetails){
            return res.status(200).json(
               new ApiError(
                  "No Such user is found out"
               )
            )
         }
         
        const valid = comparePasswords(password , userdetails.password) ; 
        if(!valid){
         return res.status(200).json(
            new ApiError(
               "Invalid Password" 
            )
         )
        }

        const userId : string = userdetails.id 
        
        const jwtPayload : jwtPayload = {
         id : userId 
        }
         
        const accessToken : string = generateAccessToken(jwtPayload) ; 

        return res.status(200).json(
         new ApiResponse(
            "User is found , and successfully login" ,
            { accessToken: accessToken } 
         )
        )
      }
      catch(err : any){
         return res.status(404).json(
            new ApiError(
               "Error in verifying the user" , 
               err 
            )
         )
      }
   }


}



export const authController = new AuthController(database) 



authController.createUser = authController.createUser.bind(authController) ; 
authController.verifyOtp = authController.verifyOtp.bind(authController) ;
authController.forgotPasswordChange = authController.forgotPasswordChange.bind(authController) ; 
authController.forgotPasswordVerification = authController.forgotPasswordVerification.bind(authController) ; 
authController.verifyUser = authController.verifyUser.bind(authController) ; 