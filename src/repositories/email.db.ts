import {  PrismaClient } from "@prisma/client";
import { database } from "../lib/database";

class Email {

    private db : PrismaClient
    constructor(database : PrismaClient){
       this.db = database ; 
    }


    async adding(email : string){
        try{
          const addEmail = await this.db.email.create({
             data : {
                email : email
             }
          })
        }
        catch(err : any){
            throw err ; 
        }
    }
    
}


export const emailRepositories = new Email(database) ; 