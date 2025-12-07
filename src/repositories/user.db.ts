import { database } from "../config/database";
import { PrismaClient } from "../prisma/generated/prisma/client";
import {
  userDetails,
  userSignInputDetails
} from "../types/user.types";
import ApiError from "../utils/ApiError";

class User {
  private db: PrismaClient;
  constructor(db: any) {
    this.db = db;
  }

  // checking wheather the user is already present or not in the db
  async checkingUserPresent(email : string) {
  
    try {
      const allInformation: userDetails | null = await this.db.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!allInformation) {
        throw new ApiError("User is not found in the db");
      }
      return allInformation;
    } catch (err: any) {
      throw new ApiError(
        "Error is comming in checking the user , present in the db or not",
        err
      );
    }
  }

  // creating the user with not verified status , it means right now user is not verified
  async creatingUser(details : userSignInputDetails) {
    const { name, email, password } = details;

    try {
      await this.db.user.create({
        data: {
          name: name,
          email: email,
          password: password,
          is_verified: false,
        },
      });
    } catch (err: any) {
      throw new ApiError("Error in creating the user", err);
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
      throw new ApiError("Error in changing the is_verified status", err);
    }
  }
   

  // updating the access token in the table 
   async updateAccessToken(email : string , access_token : string){
    try {
      await this.db.user.update({
        where : {
          email : email
        } ,
        data : {
          access_token : access_token
        }
      })
    }

    catch(err : any){
      throw new ApiError(
        "Error in inserting the access_token" , 
        err 
      )
    }
   }
   
}

export const user = new User({
  db: database,
});
