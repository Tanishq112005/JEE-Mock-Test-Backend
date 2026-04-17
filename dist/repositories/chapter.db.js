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
                isJeeAdvanced: true,
                isJeeMain: true,
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
    gettingDetailedGroups = async (subjectName) => {
        try {
            const subjectParts = await this.db.subjects.findUnique({
                where: { name: subjectName },
                include: { chapters: { select: { group: true }, distinct: ["group"] } }
            });
            if (!subjectParts) {
                throw new ApiError_1.default("Subject not found");
            }
            return subjectParts.chapters.map((ch, index) => ({
                id: `${subjectParts.id}-group-${index}`,
                subjectId: subjectParts.id,
                subjectName: subjectParts.name,
                groupName: ch.group
            }));
        }
        catch (err) {
            throw err;
        }
    };
    gettingChapterId = async (chapterName) => {
        // Case-insensitive lookup so "kinematics" matches "Kinematics" etc.
        const chapterRecord = await this.db.chapters.findFirst({
            where: { name: { equals: chapterName } },
        });
        if (!chapterRecord) {
            throw new ApiError_1.default(`Chapter "${chapterName}" not found. Check the exact chapter name stored in the database.`);
        }
        return chapterRecord;
    };
    gettingChapterDetails = async (chapterId) => {
        try {
            const chapterDetails = await this.db.chapters.findFirst({
                where: {
                    id: chapterId
                }
            });
            return chapterDetails;
        }
        catch (err) {
            throw err;
        }
    };
}
exports.chapter = new Chapter(database_1.database);
