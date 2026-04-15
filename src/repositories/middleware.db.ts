import { PrismaClient } from "@prisma/client";
import { database } from "../lib/database";

class Middleware {
    private db : PrismaClient ;
    constructor(database : PrismaClient){
        this.db = database ;
    }


    async gettingStudentId(userId : string){
        try {
           const studentProfile = await this.db.studentProfile.findUnique({
            where : {
                user_id : userId 
            }
           })
           console.log(studentProfile) ;
           console.log(studentProfile?.id) ; 

           if(!studentProfile?.id) {
             // Profile not created yet — treat as unauthorized so middleware returns 401
             throw new Error(`No student profile found for userId: ${userId}`) ;
           }

           return studentProfile.id ; 
        }
        catch(err : any){
            throw err; 
        }
    }

}


export const middleware = new Middleware(database) ; 