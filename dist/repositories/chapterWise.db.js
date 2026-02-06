"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterWise = void 0;
const database_1 = require("../lib/database");
class ChapterWise {
    db;
    constructor(database) {
        this.db = database;
    }
}
exports.chapterWise = new ChapterWise(database_1.database);
