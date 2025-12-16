import { PrismaClient, SubjectName } from "@prisma/client";
import { database } from "../lib/database";
import { chapterInform, deletingPayload, gettingPayload } from "../types/chapter.types";
import ApiError from "../utils/ApiError";

class Chapter {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  // adding the chapter
  async addingChapter(payload: chapterInform) {
    try {
      const subjectInformation = await this.db.subjects.findUnique({
        where: {
          name: payload.subject as SubjectName,
        },
      });

      if (!subjectInformation) {
        throw new ApiError("Subject not found");
      }

       await this.db.chapters.create({
        data: {
          name: payload.name,
          class: payload.classNumber,
          chapterNumber: payload.chapterNumber,
          subjectId: subjectInformation.id,
        },
      });

    } catch (err) {
      throw err;
    }
  }



  // deleting the chapter 
  async deletingChapter(payload : deletingPayload){
    try {
      const chapterId = payload.id ; 
      await this.db.chapters.delete({
        where : {
            id : chapterId
        } 
      })

    }
    catch(err){
        throw err ; 
    }

  }


  // getting all the chapters depends on the condition 
 async gettingChapter(payload: gettingPayload) {
  try {
    const whereCondition: any = {};

    if (payload.classNumber) {
      whereCondition.class = Number(payload.classNumber);
    }

    if (payload.subjectName) {
      whereCondition.subjects = {
        name: payload.subjectName, 
      };
    }

    const chapterListInDb = await this.db.chapters.findMany({
      select: {
        id: true,
        name: true,
        chapterNumber: true,
        class: true,
        subjects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: whereCondition,
      orderBy: {
        chapterNumber: "asc",
      },
    });

    return chapterListInDb;
  } catch (err) {
    throw err;
  }
}
}


export const chapter = new Chapter(database);
