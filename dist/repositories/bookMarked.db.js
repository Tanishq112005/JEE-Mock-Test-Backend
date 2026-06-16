"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookMarked = void 0;
const database_1 = require("../lib/database");
const question_db_1 = require("./question.db");
class BookMarked {
    db;
    constructor(database) {
        this.db = database;
    }
    async add(studentId, questionId) {
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
            }
            else {
                throw "Question Is Already Added In The BookMarked";
            }
        }
        catch (err) {
            throw err;
        }
    }
    async checking(studentId, questionId) {
        try {
            const dataIsPresent = await this.db.bookmarkedQuestion.findFirst({
                where: {
                    studentId: studentId,
                    questionId: questionId,
                },
            });
            if (!dataIsPresent) {
                return false;
            }
            else {
                return true;
            }
        }
        catch (err) {
            throw err;
        }
    }
    async remove(studentId, questionId) {
        try {
            await this.db.bookmarkedQuestion.delete({
                where: {
                    studentId_questionId: {
                        studentId: studentId,
                        questionId: questionId,
                    },
                },
            });
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async bookMarkedQuestion(studentId) {
        try {
            const bookmarkedRecords = await this.db.bookmarkedQuestion.findMany({
                where: {
                    studentId: studentId,
                },
            });
            if (bookmarkedRecords.length === 0)
                return [];
            const questionIds = bookmarkedRecords.map(record => record.questionId);
            // Fetch all questions in one bulk query
            const fetchedQuestions = await question_db_1.question.getQuestionsByIdsWithSignedUrls(questionIds);
            // Map the created_at timestamp back from the bookmark record
            const questionList = fetchedQuestions.map(q => {
                const record = bookmarkedRecords.find(r => r.questionId === q.id);
                return {
                    ...q,
                    createdAt: record?.created_at
                };
            });
            questionList.sort((a, b) => {
                if (!a.createdAt || !b.createdAt)
                    return 0;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            return questionList;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.bookMarked = new BookMarked(database_1.database);
