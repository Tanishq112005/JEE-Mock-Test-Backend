"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subject = void 0;
const database_1 = require("../lib/database");
class Subject {
    db;
    constructor(database) {
        this.db = database;
    }
    async addingSubject(name) {
        try {
            const reading = await this.db.subjects.create({
                data: {
                    name: name
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async deletingSubject(name) {
        try {
            const deletingSubject = await this.db.subjects.delete({
                where: {
                    name: name
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async readingAllSubjects() {
        try {
            const allSubjectInDb = await this.db.subjects.findMany({
                select: {
                    name: true,
                    totalQuestion: true
                }
            });
            const subjectList = {};
            for (let i = 0; i < allSubjectInDb.length; i++) {
                subjectList[allSubjectInDb[i].name] = {
                    name: allSubjectInDb[i].name,
                    totalQuestion: allSubjectInDb[i].totalQuestion,
                };
            }
            return subjectList;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.subject = new Subject(database_1.database);
