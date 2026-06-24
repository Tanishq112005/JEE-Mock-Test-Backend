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
          const { redisConfig, questionRedisclient, REDIS_CACHE_EXPIRATION } = await import("../lib/redis");
          const redisKey = redisConfig.getRedisExamList();
          const cachedExams = await questionRedisclient.get(redisKey);

          if (cachedExams) {
            console.log(`[Cache Hit] Exam list coming from Redis.`);
            return JSON.parse(cachedExams);
          }

          console.log(`[Cache Miss] Exam list coming from Database.`);
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

          await questionRedisclient.setEx(redisKey, REDIS_CACHE_EXPIRATION, JSON.stringify(examList));

          return examList ; 
        }
        catch(err){
            throw err ; 
        }
    }
    

    async gettingIdOfExam(examName : string) : Promise<any> {
        try {
           const { redisConfig, questionRedisclient, REDIS_CACHE_EXPIRATION } = await import("../lib/redis");
           const redisKey = redisConfig.getRedisExamId(examName);
           const cachedExamId = await questionRedisclient.get(redisKey);

           if (cachedExamId) {
             console.log(`[Cache Hit] Exam ID for "${examName}" coming from Redis.`);
             return JSON.parse(cachedExamId);
           }

           console.log(`[Cache Miss] Exam ID for "${examName}" coming from Database.`);
           let condition ; 
           if(examName === ExamName.JEE_ADVANCED){
            condition = ExamName.JEE_ADVANCED 
           }
           else {
            condition = ExamName.JEE_MAIN 
           }
         
           const examDetails   = await this.db.exam.findUnique({
            where : {
                name : condition
            }
           })

           const examId = examDetails?.id ; 
           if (examId) {
             await questionRedisclient.setEx(redisKey, REDIS_CACHE_EXPIRATION, JSON.stringify(examId));
           }

           return examId ; 
        }
        catch(err){
            throw err ; 
        }
    }
}


export const exam = new Exam(database) ; 

