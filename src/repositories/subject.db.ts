import { database } from "../lib/database";
import { PrismaClient, SubjectName } from "@prisma/client";
class Subject {
   private db: PrismaClient;
   constructor(database: PrismaClient) {
      this.db = database;
   }

   async addingSubject(name: SubjectName) {
      try {
         const reading = await this.db.subjects.create({
            data: {
               name: name
            }
         });
      }
      catch (err) {
         throw err;
      }
   }


   async deletingSubject(name: SubjectName) {
      try {
         const deletingSubject = await this.db.subjects.delete({
            where: {
               name: name
            }
         })
      }
      catch (err) {
         throw err;
      }
   }


   async readingAllSubjects(): Promise<Record<string , any>> {
      try {
         const allSubjectInDb = await this.db.subjects.findMany({
            select: {
               name: true,
               totalQuestion: true
            }
         });

         const subjectList: Record<string, any> = {};

         for (let i = 0; i < allSubjectInDb.length; i++) {
            subjectList[allSubjectInDb[i].name] = {
               name: allSubjectInDb[i].name,
               totalQuestion: allSubjectInDb[i].totalQuestion,
            };
         }

         return subjectList;
      }
      catch (err) {
         throw err;
      }
   }



}


export const subject = new Subject(database); 