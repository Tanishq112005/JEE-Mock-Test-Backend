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
            // 1. Verify the paper exists
            const paperInformation = await this.db.papers.findUnique({
                where: {
                    id: questionInformation.paperId,
                },
            });
            if (!paperInformation) {
                throw new ApiError_1.default("Paper not found"); // Or your custom error handler
            }
            const transactions = [];
            // 2. Atomically update totalQuestions and totalMarks on the Paper
            transactions.push(this.db.papers.update({
                where: {
                    id: questionInformation.paperId,
                },
                data: {
                    totalQuestions: { increment: 1 },
                    totalMarks: { increment: questionInformation.positiveMarks || 0 },
                },
            }));
            // 3. Upsert the Marking Scheme for this specific question type
            // Upsert ensures we create it if it's the first question of this type, 
            // or just update it if the scheme already exists for this paper.
            if (questionInformation.questionType) {
                transactions.push(this.db.paperMarkingScheme.upsert({
                    where: {
                        paperId_questionType: {
                            paperId: questionInformation.paperId,
                            questionType: questionInformation.questionType,
                        },
                    },
                    update: {
                        // Only update what is actually provided in questionDetails
                        positiveMarks: questionInformation.positiveMarks,
                    },
                    create: {
                        paperId: questionInformation.paperId,
                        questionType: questionInformation.questionType,
                        positiveMarks: questionInformation.positiveMarks,
                        // Hardcode default values since they aren't in questionDetails
                        negativeMarks: 0,
                        isPartial: false,
                    },
                }));
            }
            // 4. Execute all queries in a single transaction
            await this.db.$transaction(transactions);
        }
        catch (err) {
            throw err;
        }
    }
    async paperMarkingScheme(paperId) {
        try {
            const paperScheme = await this.db.paperMarkingScheme.findMany({
                where: {
                    paperId: paperId
                }
            });
            return paperScheme;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.paper = new Paper(database_1.database);
