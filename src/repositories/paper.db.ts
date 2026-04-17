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

  async addpaperMarkingScheme(payload: markingSchemePayload) {
  try {
    const transactions = [];

    // 1. Integer
    if (
      payload.integerPositiveMarks !== undefined &&
      payload.integerNegativeMarks !== undefined
    ) {
      transactions.push(
        this.db.paperMarkingScheme.create({
          data: {
            paperId: payload.paperId,
            questionType: questionType.Integer,
            positiveMarks: payload.integerPositiveMarks,
            negativeMarks: payload.integerNegativeMarks,
            isPartial: payload.integerPartial ?? false,
          },
        })
      );
    }

    // 2. Single Correct
    if (
      payload.singleCorrectPositiveMarks !== undefined &&
      payload.singleCorrectNegativeMarks !== undefined
    ) {
      transactions.push(
        this.db.paperMarkingScheme.create({
          data: {
            paperId: payload.paperId,
            questionType: questionType.SingleCorrect,
            positiveMarks: payload.singleCorrectPositiveMarks,
            negativeMarks: payload.singleCorrectNegativeMarks,
            isPartial: payload.singleCorrectPartial ?? false,
          },
        })
      );
    }

    // 3. Multi Correct
    if (
      payload.multiCorrectPositiveMarks !== undefined &&
      payload.multiCorrectNegativeMarks !== undefined
    ) {
      transactions.push(
        this.db.paperMarkingScheme.create({
          data: {
            paperId: payload.paperId,
            questionType: questionType.MultiCorrect,
            positiveMarks: payload.multiCorrectPositiveMarks,
            negativeMarks: payload.multiCorrectNegativeMarks,
            isPartial: payload.multiCorrectPartial ?? false,
          },
        })
      );
    }

    // 4. Comprehension Single Correct
    if (
      payload.comprehensionSingleCorrectPositiveMarks !== undefined &&
      payload.comprehensionSingleCorrectNegativeMarks !== undefined
    ) {
      transactions.push(
        this.db.paperMarkingScheme.create({
          data: {
            paperId: payload.paperId,
            questionType: questionType.ComprehensionSingleCorrect,
            positiveMarks: payload.comprehensionSingleCorrectPositiveMarks,
            negativeMarks: payload.comprehensionSingleCorrectNegativeMarks,
            isPartial: payload.comprehensionSingleCorrectPartial ?? false,
          },
        })
      );
    }

    // 5. Comprehension Multi Correct
    if (
      payload.comprehensionMultiCorrectPositiveMarks !== undefined &&
      payload.comprehensionMultiCorrectNegativeMarks !== undefined
    ) {
      transactions.push(
        this.db.paperMarkingScheme.create({
          data: {
            paperId: payload.paperId,
            questionType: questionType.ComprehensionMultiCorrect,
            positiveMarks: payload.comprehensionMultiCorrectPositiveMarks,
            negativeMarks: payload.comprehensionMultiCorrectNegativeMarks,
            isPartial: payload.comprehensionMultiCorrectPartial ?? false,
          },
        })
      );
    }

    // 6. Comprehension Integer
    // Note: Used 'comprehensionIntgerPositiveMarks' to match the typo in your interface exactly.
    if (
      payload.comprehensionIntgerPositiveMarks !== undefined &&
      payload.comprehensionIntegerNegativeMarks !== undefined
    ) {
      transactions.push(
        this.db.paperMarkingScheme.create({
          data: {
            paperId: payload.paperId,
            questionType: questionType.ComprehensionInteger,
            positiveMarks: payload.comprehensionIntgerPositiveMarks,
            negativeMarks: payload.comprehensionIntegerNegativeMarks,
            isPartial: payload.comprehensionIntegerPartial ?? false,
          },
        })
      );
    }

    // Execute all accumulated queries in a single transaction
    if (transactions.length > 0) {
      await this.db.$transaction(transactions);
    }
    
  } catch (err: any) {
    throw err;
  }
}

  async paperMarkingScheme(paperId: string) {
    try {
      const paperScheme = await this.db.paperMarkingScheme.findMany({
        where: {
          paperId: paperId,
        },
      });

      return paperScheme;
    } catch (err: any) {
      throw err;
    }
  }
}

export const paper = new Paper(database);
