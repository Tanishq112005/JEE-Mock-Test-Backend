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
            const studentProfile = await this.db.studentProfile.findUnique({
                where: {
                    user_id: userId
                }
            });
            console.log(studentProfile);
            console.log(studentProfile?.id);
            if (!studentProfile?.id) {
                // Profile not created yet — treat as unauthorized so middleware returns 401
                throw new Error(`No student profile found for userId: ${userId}`);
            }
            return studentProfile.id;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.middleware = new Middleware(database_1.database);
