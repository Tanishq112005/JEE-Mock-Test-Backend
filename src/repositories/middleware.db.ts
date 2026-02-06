import { PrismaClient } from "@prisma/client";
import { database } from "../lib/database";

class Middleware {
    private db : PrismaClient ;
    constructor(database : PrismaClient){
        this.db = database ;
    }


    async gettingStudentId(userId : string){
        try {
           const studentId = await this.db.studentProfile.findUnique({
            where : {
                user_id : userId 
            }
           })
           console.log(studentId) ;
           console.log(studentId?.id) ; 
           return studentId?.id ; 
        }
        catch(err : any){
            throw err; 
        }
    }

}


export const middleware = new Middleware(database) ; 