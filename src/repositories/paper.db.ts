import { ExamName, papers, PrismaClient, questionType } from "@prisma/client";
import { database } from "../lib/database";

import { markingSchemePayload, paperDetails, questionDetails } from "../types/paper.types";
import { exam } from "./exam.db";
import ApiError from "../utils/ApiError";

class Paper {
  private db: PrismaClient;
  constructor(database: PrismaClient) {
    this.db = database;
  }

  // adding the paper information
  async addingPapers(paperInformation: paperDetails) {
    try {
      // getting the exam id
      const examId = await exam.gettingIdOfExam(paperInformation.exam);
      const newPaper = await this.db.papers.create({
        data: {
          examId: examId,
          year: paperInformation.year,
          shift: paperInformation.shift,
          month: paperInformation.Month,
          day: paperInformation.day,
          mode: paperInformation.mode,
          totalDuration: paperInformation.totalDuration,
          date: paperInformation.date,
          session : paperInformation.session 
        },
      });

      return newPaper.id;
    } catch (err) {
      throw err;
    }
  }

  // deleting the paper from the database
  async deletingPapers(paperId: string) {
    try {
      await this.db.papers.delete({
        where: {
          id: paperId,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  // getting all the papers
  // -> on the basis of the exam
  async gettingPaperInformation(year: number, examName?: ExamName) {
    try {
      if (year == 0 && examName == null) {
        return new ApiError(
          "Pass some thing , like year or the examName for getting the all the papers",
        );
      }

      if (year != 0 && examName == null) {
        return this.db.papers.findMany({
          where: {
            year: year,
          },
        });
      }

      if (year == 0 && examName != null) {
        const examId = await exam.gettingIdOfExam(examName);
        return this.db.papers.findMany({
          where: {
            examId: examId,
          },
        });
      }

      if (year != 0 && examName != null) {
        const examId = await exam.gettingIdOfExam(examName);
        return this.db.papers.findMany({
          where: {
            examId: examId,
            year: year,
          },
        });
      }
    } catch (err) {
      throw err;
    }
  }

  async addingDetails(questionInformation: questionDetails) {
    try {
      // 1. Verify the paper exists
      const paperInformation = await this.db.papers.findUnique({
        where: {
          id: questionInformation.paperId,
        },
      });

      if (!paperInformation) {
        throw new ApiError("Paper not found"); // Or your custom error handler
      }

      const transactions = [];

      // 2. Atomically update totalQuestions and totalMarks on the Paper
      transactions.push(
        this.db.papers.update({
          where: {
            id: questionInformation.paperId,
          },
          data: {
            totalQuestions: { increment: 1 },
            totalMarks: { increment: questionInformation.positiveMarks || 0 },
          },
        }),
      );

     
      await this.db.$transaction(transactions);
    } catch (err) {
      throw err;
    }
  }


}

export const paper = new Paper(database);
