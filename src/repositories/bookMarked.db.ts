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

    if (bookmarkedRecords.length === 0) return [];

    const questionIds = bookmarkedRecords.map(record => record.questionId);
    
    // Fetch all questions in one bulk query
    const fetchedQuestions = await question.getQuestionsByIdsWithSignedUrls(questionIds);

    // Map the created_at timestamp back from the bookmark record
    const questionList = fetchedQuestions.map(q => {
      const record = bookmarkedRecords.find(r => r.questionId === q.id);
      return {
        ...q,
        createdAt: record?.created_at
      };
    });

    questionList.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return questionList;

  } catch (err: any) {
    throw err;
  }
}

}

export const bookMarked = new BookMarked(database);
