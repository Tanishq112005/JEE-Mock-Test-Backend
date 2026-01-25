"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterController = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const client_1 = require("@prisma/client");
const chapter_db_1 = require("../repositories/chapter.db");
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class ChapterController {
    constructor() { }
    // adding the chapter
    addingChapter = async (req, res) => {
        const { name, chapterNumber, classNumber, group, subject, isCbse, isJeeMain, isJeeAdvanced } = req.body;
        try {
            if (!Object.values(client_1.SubjectName).includes(subject)) {
                return res.status(400).json(new ApiError_1.default("Invalid subject name"));
            }
            const payload = {
                name: name,
                chapterNumber: chapterNumber,
                classNumber: classNumber,
                group: group,
                subject: subject,
                isCbse: isCbse,
                isJeeAdvanced: isJeeAdvanced,
                isJeeMain: isJeeMain
            };
            await chapter_db_1.chapter.addingChapter(payload);
            res.status(200).json(new ApiResponse_1.default("Chapter is added successfully"));
        }
        catch (err) {
            console.log(err);
            res.status(500).json(new ApiError_1.default("Error in adding the chapter", err));
        }
    };
    // deleting the chapter
    deletingChapter = async (req, res) => {
        const { id } = req.body;
        try {
            const payload = {
                id: id
            };
            await chapter_db_1.chapter.deletingChapter(payload);
            res.status(200).json(new ApiResponse_1.default("Chapter is removed successfully"));
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Error in deleting the chapter", err));
        }
    };
    // getting all the chapter
    getChapters = async (req, res) => {
        try {
            const { classNumber, subjectName } = req.query;
            const payload = {};
            if (classNumber) {
                payload.classNumber = Number(classNumber);
            }
            if (subjectName) {
                if (!Object.values(client_1.SubjectName).includes(subjectName)) {
                    return res
                        .status(400)
                        .json(new ApiError_1.default("Invalid subject name"));
                }
                payload.subjectName = subjectName;
            }
            const chapters = await chapter_db_1.chapter.gettingChapter(payload);
            return res.status(200).json(new ApiResponse_1.default("Chapters fetched successfully", chapters));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error fetching chapters", err));
        }
    };
    groupName = async (req, res) => {
        try {
            let { subjectName } = req.query;
            if (subjectName) {
                if (!Object.values(client_1.SubjectName).includes(subjectName)) {
                    return res
                        .status(400)
                        .json(new ApiError_1.default("Invalid subject name"));
                }
                subjectName = subjectName;
            }
            const finalResponse = await chapter_db_1.chapter.gettingGroup(subjectName);
            return res.status(200).json(new ApiResponse_1.default(`Group Of the ${subjectName} are: `, finalResponse));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting the group", err));
        }
    };
}
exports.chapterController = new ChapterController();
