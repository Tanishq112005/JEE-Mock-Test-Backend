"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exam = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../lib/database");
class Exam {
    db;
    constructor(database) {
        this.db = database;
    }
    async addingExam(name) {
        try {
            const adding = await this.db.exam.create({
                data: {
                    name: name
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async deletingExam(name) {
        try {
            const deleting = await this.db.exam.delete({
                where: {
                    name: name
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async gettingExam() {
        try {
            const examInDb = await this.db.exam.findMany({
                select: {
                    name: true
                }
            });
            let examList = [];
            for (let i = 0; i < examInDb.length; i++) {
                examList.push(examInDb[i].name);
            }
            return examList;
        }
        catch (err) {
            throw err;
        }
    }
    async gettingIdOfExam(examName) {
        try {
            let condition;
            if (examName === client_1.ExamName.JEE_ADVANCED) {
                condition = client_1.ExamName.JEE_ADVANCED;
            }
            else {
                condition = client_1.ExamName.JEE_MAIN;
            }
            const examDetails = await this.db.exam.findUnique({
                where: {
                    name: condition
                }
            });
            return examDetails?.id;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.exam = new Exam(database_1.database);
