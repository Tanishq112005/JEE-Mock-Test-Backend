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
    // ---------------- ADD CHAPTER ----------------
    addingChapter = async (payload) => {
        console.log("REPO PAYLOAD:", payload);
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
                isJeeAdvanced: payload.isJeeAdvanced,
                isJeeMain: payload.isJeeMain,
                group: payload.group,
            },
        });
    };
    // ---------------- DELETE CHAPTER ----------------
    deletingChapter = async (payload) => {
        await this.db.chapters.delete({
            where: {
                id: payload.id,
            },
        });
    };
    // ---------------- GET CHAPTERS ----------------
    gettingChapter = async (payload) => {
        const whereCondition = {};
        if (payload.classNumber) {
            whereCondition.class = payload.classNumber;
        }
        if (payload.subjectName) {
            whereCondition.subjects = {
                name: payload.subjectName,
            };
        }
        if (payload.group) {
            whereCondition.group = payload.group;
        }
        return this.db.chapters.findMany({
            where: whereCondition,
            orderBy: {
                chapterNumber: "asc",
            },
            select: {
                id: true,
                name: true,
                chapterNumber: true,
                group: true,
                class: true,
                subjects: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    };
    gettingGroup = async (subjectName) => {
        try {
            const groups = await this.db.chapters.findMany({
                where: {
                    subjects: {
                        name: subjectName, // Ensure strict Enum matching
                    },
                },
                select: {
                    group: true,
                },
                distinct: ["group"],
            });
            // Transform [{ group: "Mechanics" }, { group: "Optics" }] -> ["Mechanics", "Optics"]
            return groups.map((item) => item.group);
        }
        catch (err) {
            throw err;
        }
    };
    gettingChapterId = async (chapterName) => {
        const chapter = await this.db.chapters.findUnique({
            where: { name: chapterName },
        });
        if (!chapter) {
            throw new ApiError_1.default("Chapter not found");
        }
        return chapter;
    };
}
exports.chapter = new Chapter(database_1.database);
