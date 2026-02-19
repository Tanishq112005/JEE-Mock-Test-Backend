"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analytics = void 0;
const database_1 = require("../lib/database");
class Analytics {
    db;
    constructor(database) {
        this.db = database;
    }
    // collecting the total question number
    async collectingTotalQuestion() {
        try {
            const allSujectInformation = await this.db.subjects.findMany();
            return allSujectInformation;
        }
        catch (err) {
            throw err;
        }
    }
    // collecting the user data
    // subject wise analytics
    async subjectAnanlytics(studentId) {
        try {
            const subjectInformation = await this.db.subjectAnalytics.findMany({
                where: {
                    studentId: studentId,
                },
            });
            return subjectInformation;
        }
        catch (err) {
            throw err;
        }
    }
    // student analytics
    async studentOverAllAnalytics(studentId) {
        try {
            const studentInformation = await this.db.studentOverallAnalytics.findMany({
                where: {
                    studentId: studentId,
                },
            });
            return studentInformation;
        }
        catch (err) {
            throw err;
        }
    }
    // question wise analytics
    async questionWiseAnalytics(studentId) {
        try {
            const questionWiseAnalytics = await this.db.studentQuestionAnalytics.findMany({
                where: {
                    studentId: studentId,
                },
            });
            return questionWiseAnalytics;
        }
        catch (err) {
            throw err;
        }
    }
    // subject wise analytics
    async subjectWiseAnalytics(studentId) {
        try {
            const subjectWiseAnalytics = await this.db.subjectAnalytics.findMany({
                where: {
                    studentId: studentId,
                },
            });
            return subjectWiseAnalytics;
        }
        catch (err) {
            throw err;
        }
    }
    // test wise data or test summary of all
    async testWiseData(studentId) {
        try {
            const rawTestData = await this.db.testAttemptSummary.findMany({
                where: {
                    studentId: studentId,
                },
                include: {
                    subjectResults: true, // Fetch the nested subject data
                    questionTypeResults: true,
                    testStatus: {
                        include: {
                            papers: { include: {
                                    exam: true, // ✅ Fetch exam name
                                },
                            }
                        }
                    } // Fetch the nested question type data
                },
                orderBy: {
                    created_at: "desc",
                },
            });
            // Format the data to match the evaluation report structure
            return rawTestData.map((test) => {
                // Helper to find specific subject data from the array
                const getSub = (name) => test.subjectResults.find((s) => s.subjectName === name);
                const math = getSub("Mathematics");
                const physics = getSub("Physics");
                const chemistry = getSub("Chemistry");
                // Reconstruct the questionTypes object from the database array
                const formattedQuestionTypes = {};
                test.questionTypeResults.forEach((qt) => {
                    // We use the same formatStats helper because the columns are identical
                    formattedQuestionTypes[qt.questionType] = this.formatStats(qt);
                });
                const examName = test.testStatus.papers.exam.name;
                const paper = test.testStatus.papers;
                return {
                    id: test.id,
                    testStatusId: test.testStatusId,
                    exam: examName,
                    created_at: test.created_at,
                    math: math ? this.formatStats(math) : null,
                    physics: physics ? this.formatStats(physics) : null,
                    chemistry: chemistry ? this.formatStats(chemistry) : null,
                    overall: {
                        totalScore: test.totalScore,
                        maxScore: test.maxScore,
                        percentage: test.percentage,
                        overallAccuracy: test.accuracy,
                        totalTimeTaken: test.timeTaken,
                        averageTimePerQuestion: test.avgTimePerQ,
                    },
                    paperMeta: {
                        year: paper.year,
                        month: paper.month,
                        day: paper.day,
                        date: paper.date,
                        shift: paper.shift,
                        mode: paper.mode,
                        totalMarks: paper.totalMarks,
                        totalDuration: paper.totalDuration,
                        totalQuestions: paper.totalQuestions,
                    },
                    questionTypes: formattedQuestionTypes, // Injected the newly formatted object
                };
            });
        }
        catch (err) {
            throw err;
        }
    }
    // Renamed to formatStats since it perfectly formats both Subjects AND Question Types
    formatStats(statBlock) {
        return {
            totalQuestions: statBlock.totalQuestions,
            attempt: statBlock.attempted,
            marks: statBlock.marks,
            timeTaken: statBlock.timeTaken,
            positiveMarks: statBlock.positiveMarks,
            paritalMarks: statBlock.partialMarks, // keeping your 'parital' typo for consistency
            negativeMarks: statBlock.negativeMarks,
            correct: statBlock.correct,
            partial: statBlock.partial,
            wrong: statBlock.wrong,
            accuracy: statBlock.accuracy,
        };
    }
    async getTestChapterSnapshots(studentId) {
        try {
            return await this.db.testChapterAnalytics.findMany({
                where: { studentId },
                orderBy: { created_at: 'desc' },
            });
        }
        catch (err) {
            throw err;
        }
    }
    // chapter wise analytics
    async chapterWiseAnalytics(stduentId) {
        try {
            const chapterWiseAnalytics = await this.db.chapterAnalytics.findMany({
                where: {
                    studentId: stduentId,
                },
            });
            return chapterWiseAnalytics;
        }
        catch (err) {
            throw err;
        }
    }
    // exam wise analytics
    async examWiseAnalytics(studentId) {
        try {
            const examWiseAnalytics = await this.db.examAnalytics.findMany({
                where: {
                    studentId: studentId,
                },
            });
            return examWiseAnalytics;
        }
        catch (err) { }
    }
}
exports.analytics = new Analytics(database_1.database);
