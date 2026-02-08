"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRepositories = void 0;
const database_1 = require("../lib/database");
class Email {
    db;
    constructor(database) {
        this.db = database;
    }
    async adding(email) {
        try {
            const addEmail = await this.db.email.create({
                data: {
                    email: email
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
}
exports.emailRepositories = new Email(database_1.database);
