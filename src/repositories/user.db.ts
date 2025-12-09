import { database } from "../lib/database";

import {
  userDetails,
  userSignInputDetails
} from "../types/user.types";
import { comparePasswords } from "../utils/password";


type ExtendedPrismaClient = typeof database;
class User {
  private db: ExtendedPrismaClient ;
  constructor(database : ExtendedPrismaClient) {
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
      throw err ; 
    }
   }
   

   // updating the password in the table using the userid 
   async updatePassword(user_id : string , password : string){
    try {
      await this.db.user.update({
        where : {
          id : user_id 
        }
        , 
        data : {
          password : password
        }
      })

    }
    catch(err : any){
      throw err ; 
    }
   }



   // for finding the user in the table 
   async userDetails(email : string ){
    try {
      const userDetails = await this.db.user.findUnique(
        {
          where : {
            email : email 
          }
        }
      )
      
    
      return userDetails ; 
    }
    catch(err : any){
      throw err ; 
    }
   }
}

export const user = new User(database);
