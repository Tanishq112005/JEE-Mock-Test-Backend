import { PrismaClient } from "@prisma/client";
import { database } from "../lib/database";
import { question } from "./question.db";

class BookMarked {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  async add(studentId: string, questionId: string) {
    try {
      const dataIsPresent = await this.db.bookmarkedQuestion.findFirst({
        where: {
          studentId: studentId,
          questionId: questionId,
        },
      });

      if (!dataIsPresent) {
        await this.db.bookmarkedQuestion.create({
          data: {
            studentId: studentId,
            questionId: questionId,
          },
        });
      } else {
        throw "Question Is Already Added In The BookMarked";
      }
    } catch (err: any) {
      throw err;
    }
  }

  async checking(studentId: string, questionId: string) : Promise<boolean> {
    try {
      const dataIsPresent = await this.db.bookmarkedQuestion.findFirst({
        where: {
          studentId: studentId,
          questionId: questionId,
        },
      });

      if (!dataIsPresent) {
        return false ; 
      } else {
         return true  ; 
      }
    } catch (err: any) {
      throw err;
    }
  }

  async remove(studentId: string, questionId: string) {
    try {
      await this.db.bookmarkedQuestion.delete({
        where: {
          studentId_questionId: {
          studentId: studentId,
          questionId: questionId,
        },
        },
      });
    } catch (err: any) {
      console.log(err) ; 
      throw err;
    }
  }
  


 async bookMarkedQuestion(studentId: string) {
  try {
    const bookmarkedRecords = await this.db.bookmarkedQuestion.findMany({
      where: {
        studentId: studentId,
      },
    });

   
    const questionList = await Promise.all(
      bookmarkedRecords.map(async (record) => {
        const questionData = await question.getQuestionByIdWithSignedUrls(record.questionId);

        return {
          ...questionData, 
         
          createdAt: record.created_at
        };
      })
    );

   
    questionList.sort((a, b) => {

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return questionList;

  } catch (err: any) {
    throw err;
  }
}

}

export const bookMarked = new BookMarked(database);
