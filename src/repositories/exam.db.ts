import { ExamName, PrismaClient } from "@prisma/client";
import { database } from "../lib/database";

class Exam {
    private db : PrismaClient ;  
    constructor(database : PrismaClient){
        this.db = database ; 
    }
    

    async addingExam(name : ExamName){
        try {
           const adding = await this.db.exam.create({
            data : {
                name : name 
            }
           })
        } 
        catch(err){
            throw err ; 
        }
    }


    async deletingExam(name : ExamName){
        try {
           const deleting = await this.db.exam.delete({
            where : {
                name : name 
            }
           })
        }
        catch(err){
            throw err ; 
        }
    }



    async gettingExam() : Promise<string[]> {
        try {
          const examInDb = await this.db.exam.findMany(
            {
                select : {
                    name : true 
                }
            }
          )

          let examList : string[] = [] ; 
          for(let i = 0 ; i<examInDb.length ; i++){
            examList.push(examInDb[i].name) ; 
          }

          return examList ; 
        }
        catch(err){
            throw err ; 
        }
    }

}


export const exam = new Exam(database) ; 

