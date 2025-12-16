"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapter = void 0;
const database_1 = require("../lib/database");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
class Chapter {
    db;
    constructor(database) {
        this.db = database;
    }
    // adding the chapter
    async addingChapter(payload) {
        try {
            const subjectInformation = await this.db.subjects.findUnique({
                where: {
                    name: payload.subject,
                },
            });
            if (!subjectInformation) {
                throw new ApiError_1.default("Subject not found");
            }
            await this.db.chapters.create({
                data: {
                    name: payload.name,
                    class: payload.classNumber,
                    chapterNumber: payload.chapterNumber,
                    subjectId: subjectInformation.id,
                },
            });
        }
        catch (err) {
            throw err;
        }
    }
    // deleting the chapter 
    async deletingChapter(payload) {
        try {
            const chapterId = payload.id;
            await this.db.chapters.delete({
                where: {
                    id: chapterId
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    // getting all the chapters depends on the condition 
    async gettingChapter(payload) {
        try {
            const whereCondition = {};
            if (payload.classNumber) {
                whereCondition.class = Number(payload.classNumber);
            }
            if (payload.subjectName) {
                whereCondition.subjects = {
                    name: payload.subjectName,
                };
            }
            const chapterListInDb = await this.db.chapters.findMany({
                select: {
                    id: true,
                    name: true,
                    chapterNumber: true,
                    class: true,
                    subjects: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                where: whereCondition,
                orderBy: {
                    chapterNumber: "asc",
                },
            });
            return chapterListInDb;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.chapter = new Chapter(database_1.database);
