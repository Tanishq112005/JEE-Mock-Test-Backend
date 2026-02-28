import { Prisma, PrismaClient } from "@prisma/client";
import { database } from "../lib/database";

import {
  userDetails,
  userSignInputDetails
} from "../types/user.types";
import ApiError from "../utils/ApiError";



class User {
  private db: PrismaClient ;
  constructor(database : PrismaClient) {
    this.db = database;
  }

  // checking wheather the user is already present or not in the db
  async checkingUserPresent(email : string) {
  
    try {
      const allInformation: userDetails | null = await this.db.user.findUnique({
        where: {
          email: email,
        },
      });

      
      return allInformation;
    } catch (err: any) {
      console.log(err) ; 
      throw err ;
    }
  }

  // creating the user with not verified status , it means right now user is not verified
  async creatingUser(details : userSignInputDetails) {
    const { name, email, password , type} = details;

    try {
      await this.db.user.create({
        data: {
          name: name,
          email: email,
          password: password,
          is_verified: false,
          type : type
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  // for changing the is_verified status to be true
  async changingIsVerifiedStatus(email: string) {
   
    try {
      await this.db.user.update({
        where: {
          email: email,
        },
        data: {
          is_verified: true,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }
   

  // updating the access token in the table 
   async updateRefershToken(email : string , refersh_token : string){
    try {
      await this.db.user.update({
        where : {
          email : email
        } ,
        data : {
          refersh_token : refersh_token
        }
      })
    }

    catch(err : any){
      throw err ; 
    }
   }
   

   // updating the password in the table using the userid 
   // src/repositories/user.db.ts

   async updatePassword(user_id : string , password : string){
    try {
      console.log(`🔍 REPO: Attempting to update User ID: ${user_id}`);
      
      // 1. Check if user exists BEFORE updating (Debugging step)
      const exists = await this.db.user.findUnique({ where: { id: user_id }});
      if (!exists) {
          console.error(`❌ REPO ERROR: User ID ${user_id} does not exist in DB!`);
          throw new Error(`User ID ${user_id} not found`);
      }

      console.log(`👤 User Found: ${exists.email}. Updating password...`);

      // 2. Perform Update
      const updated = await this.db.user.update({
        where : { id : user_id }, 
        data : { password : password }
      })
      
      console.log("✅ REPO SUCCESS: Password hash updated in DB.");
      return updated;

    }
    catch(err : any){
      console.error("❌ REPO CRASH: Prisma failed to update:", err.message);
      throw err ; 
    }
   }


   // for finding the user in the table 
   async userDetails(email : string ){
    try {
      const userDetails = await this.db.user.findUnique(
        {
          where : {
            email : email ,
            is_verified : true
          }
        }
      )
      
    
      return userDetails ; 
    }
    catch(err : any){
      throw err ; 
    }
   }


   // for finding the user through the id 
   async userDetailsThroughId(id : string){
    try {
      const userDetails = await this.db.user.findUnique(
        {
          where : {
            id : id 
          }
        }
      )
      

      if(!userDetails){
         throw new ApiError("No such type of the user exxists in the table") ;
      }
      return userDetails ; 


     }
    catch(err : any){
      throw err ; 
    }
   }




   async creatingStudent(userId : string){
    try {
      const studentProfile = await this.db.studentProfile.create({
        data : {
          user_id : userId
        }
      }) ;

    }
    catch(err : any){
      throw err ;
    }
   }
}

export const user = new User(database);
