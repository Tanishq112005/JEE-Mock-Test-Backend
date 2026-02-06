"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware = void 0;
const database_1 = require("../lib/database");
class Middleware {
    db;
    constructor(database) {
        this.db = database;
    }
    async gettingStudentId(userId) {
        try {
            const studentId = await this.db.studentProfile.findUnique({
                where: {
                    user_id: userId
                }
            });
            console.log(studentId);
            console.log(studentId?.id);
            return studentId?.id;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.middleware = new Middleware(database_1.database);
