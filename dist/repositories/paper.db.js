"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paper = void 0;
const database_1 = require("../lib/database");
const exam_db_1 = require("./exam.db");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
class Paper {
    db;
    constructor(database) {
        this.db = database;
    }
    // adding the paper information 
    async addingPapers(paperInformation) {
        try {
            // getting the exam id 
            const examId = await exam_db_1.exam.gettingIdOfExam(paperInformation.exam);
            const newPaper = await this.db.papers.create({
                data: {
                    examId: examId,
                    year: paperInformation.year,
                    shift: paperInformation.shift,
                    month: paperInformation.Month,
                    day: paperInformation.day,
                    mode: paperInformation.mode,
                    totalDuration: paperInformation.totalDuration,
                    date: paperInformation.date
                }
            });
            return newPaper.id;
        }
        catch (err) {
            throw err;
        }
    }
    // deleting the paper from the database 
    async deletingPapers(paperId) {
        try {
            await this.db.papers.delete({
                where: {
                    id: paperId
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    // getting all the papers 
    // -> on the basis of the exam
    async gettingPaperInformation(year, examName) {
        try {
            if (year == 0 && examName == null) {
                return new ApiError_1.default("Pass some thing , like year or the examName for getting the all the papers");
            }
            if (year != 0 && examName == null) {
                return this.db.papers.findMany({
                    where: {
                        year: year
                    }
                });
            }
            if (year == 0 && examName != null) {
                const examId = await exam_db_1.exam.gettingIdOfExam(examName);
                return this.db.papers.findMany({
                    where: {
                        examId: examId
                    }
                });
            }
            if (year != 0 && examName != null) {
                const examId = await exam_db_1.exam.gettingIdOfExam(examName);
                return this.db.papers.findMany({
                    where: {
                        examId: examId,
                        year: year
                    }
                });
            }
        }
        catch (err) {
            throw err;
        }
    }
    async addingDetails(questionInformation) {
        try {
            const paperInformation = await this.db.papers.findUnique({
                where: {
                    id: questionInformation.paperId,
                },
            });
            if (!paperInformation) {
                throw new ApiError_1.default("Paper not found");
            }
            let multiChoice = paperInformation.totalMultiChoice || 0;
            let singleChoice = paperInformation.totalSingleChoice || 0;
            let integer = paperInformation.totalInteger || 0;
            let paperMarks = paperInformation.totalMarks || 0;
            const marks = paperMarks + questionInformation.positiveMarks;
            if (questionInformation.questionType === "Integer" || questionInformation.questionType === "ComprehensionInteger") {
                integer += 1;
            }
            if (questionInformation.questionType === "MultiCorrect" || questionInformation.questionType === "ComprehensionMultiCorrect") {
                multiChoice += 1;
            }
            if (questionInformation.questionType === "SingleCorrect" ||
                questionInformation.questionType === "ComprehensionSingleCorrect") {
                singleChoice += 1;
            }
            if (questionInformation.questionType)
                await this.db.papers.update({
                    where: {
                        id: questionInformation.paperId,
                    },
                    data: {
                        totalQuestions: (paperInformation.totalQuestions || 0) + 1,
                        totalMarks: marks,
                        totalSingleChoice: singleChoice,
                        totalMultiChoice: multiChoice,
                        totalInteger: integer,
                    },
                });
        }
        catch (err) {
            throw err;
        }
    }
}
exports.paper = new Paper(database_1.database);
