"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paper = void 0;
const client_1 = require("@prisma/client");
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
                    date: paperInformation.date,
                    session: paperInformation.session
                },
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
                    id: paperId,
                },
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
                        year: year,
                    },
                });
            }
            if (year == 0 && examName != null) {
                const examId = await exam_db_1.exam.gettingIdOfExam(examName);
                return this.db.papers.findMany({
                    where: {
                        examId: examId,
                    },
                });
            }
            if (year != 0 && examName != null) {
                const examId = await exam_db_1.exam.gettingIdOfExam(examName);
                return this.db.papers.findMany({
                    where: {
                        examId: examId,
                        year: year,
                    },
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
            await this.db.$transaction(transactions);
        }
        catch (err) {
            throw err;
        }
    }
    async addpaperMarkingScheme(payload) {
        try {
            const transactions = [];
            // 1. Integer
            if (payload.integerPositiveMarks !== undefined &&
                payload.integerNegativeMarks !== undefined) {
                transactions.push(this.db.paperMarkingScheme.create({
                    data: {
                        paperId: payload.paperId,
                        questionType: client_1.questionType.Integer,
                        positiveMarks: payload.integerPositiveMarks,
                        negativeMarks: payload.integerNegativeMarks,
                        isPartial: payload.integerPartial ?? false,
                    },
                }));
            }
            // 2. Single Correct
            if (payload.singleCorrectPositiveMarks !== undefined &&
                payload.singleCorrectNegativeMarks !== undefined) {
                transactions.push(this.db.paperMarkingScheme.create({
                    data: {
                        paperId: payload.paperId,
                        questionType: client_1.questionType.SingleCorrect,
                        positiveMarks: payload.singleCorrectPositiveMarks,
                        negativeMarks: payload.singleCorrectNegativeMarks,
                        isPartial: payload.singleCorrectPartial ?? false,
                    },
                }));
            }
            // 3. Multi Correct
            if (payload.multiCorrectPositiveMarks !== undefined &&
                payload.multiCorrectNegativeMarks !== undefined) {
                transactions.push(this.db.paperMarkingScheme.create({
                    data: {
                        paperId: payload.paperId,
                        questionType: client_1.questionType.MultiCorrect,
                        positiveMarks: payload.multiCorrectPositiveMarks,
                        negativeMarks: payload.multiCorrectNegativeMarks,
                        isPartial: payload.multiCorrectPartial ?? false,
                    },
                }));
            }
            // 4. Comprehension Single Correct
            if (payload.comprehensionSingleCorrectPositiveMarks !== undefined &&
                payload.comprehensionSingleCorrectNegativeMarks !== undefined) {
                transactions.push(this.db.paperMarkingScheme.create({
                    data: {
                        paperId: payload.paperId,
                        questionType: client_1.questionType.ComprehensionSingleCorrect,
                        positiveMarks: payload.comprehensionSingleCorrectPositiveMarks,
                        negativeMarks: payload.comprehensionSingleCorrectNegativeMarks,
                        isPartial: payload.comprehensionSingleCorrectPartial ?? false,
                    },
                }));
            }
            // 5. Comprehension Multi Correct
            if (payload.comprehensionMultiCorrectPositiveMarks !== undefined &&
                payload.comprehensionMultiCorrectNegativeMarks !== undefined) {
                transactions.push(this.db.paperMarkingScheme.create({
                    data: {
                        paperId: payload.paperId,
                        questionType: client_1.questionType.ComprehensionMultiCorrect,
                        positiveMarks: payload.comprehensionMultiCorrectPositiveMarks,
                        negativeMarks: payload.comprehensionMultiCorrectNegativeMarks,
                        isPartial: payload.comprehensionMultiCorrectPartial ?? false,
                    },
                }));
            }
            // 6. Comprehension Integer
            // Note: Used 'comprehensionIntgerPositiveMarks' to match the typo in your interface exactly.
            if (payload.comprehensionIntgerPositiveMarks !== undefined &&
                payload.comprehensionIntegerNegativeMarks !== undefined) {
                transactions.push(this.db.paperMarkingScheme.create({
                    data: {
                        paperId: payload.paperId,
                        questionType: client_1.questionType.ComprehensionInteger,
                        positiveMarks: payload.comprehensionIntgerPositiveMarks,
                        negativeMarks: payload.comprehensionIntegerNegativeMarks,
                        isPartial: payload.comprehensionIntegerPartial ?? false,
                    },
                }));
            }
            // Execute all accumulated queries in a single transaction
            if (transactions.length > 0) {
                await this.db.$transaction(transactions);
            }
        }
        catch (err) {
            throw err;
        }
    }
    async paperMarkingScheme(paperId) {
        try {
            const paperScheme = await this.db.paperMarkingScheme.findMany({
                where: {
                    paperId: paperId,
                },
            });
            return paperScheme;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.paper = new Paper(database_1.database);
