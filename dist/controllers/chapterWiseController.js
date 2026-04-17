"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chapterWiseController = void 0;
const questionEvalutionService_1 = require("../services/questionEvalutionService");
const uniqueCountService_1 = require("../services/uniqueCountService");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const chapterWiseCacheService_1 = require("../services/chapterWiseCacheService");
const updateChapterAttempt_producer_1 = require("../rabbitmq/producers/updateChapterAttempt-producer");
const submitChapterAttempt_producer_1 = require("../rabbitmq/producers/submitChapterAttempt-producer");
const client_1 = require("@prisma/client");
const chapter_db_1 = require("../repositories/chapter.db");
const chapterWisePractice_db_1 = require("../repositories/chapterWisePractice.db");
class ChapterWiseController {
    constructor() { }
    groupName = async (req, res) => {
        try {
            let { subjectName } = req.query;
            if (!subjectName ||
                !Object.values(client_1.SubjectName).includes(subjectName)) {
                return res.status(400).json(new ApiError_1.default("Invalid subject name"));
            }
            const finalResponse = await chapter_db_1.chapter.gettingDetailedGroups(subjectName);
            return res
                .status(200)
                .json(new ApiResponse_1.default(`Group Of the ${subjectName} are: `, finalResponse));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in getting the group", err));
        }
    };
    getChaptersByGroups = async (req, res) => {
        try {
            const { groupName } = req.query;
            if (!groupName) {
                return res.status(400).json(new ApiError_1.default("groupName is required"));
            }
            const chapters = await chapter_db_1.chapter.gettingChapter({ group: groupName });
            return res
                .status(200)
                .json(new ApiResponse_1.default(`Chapters for group ${groupName}`, chapters));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error fetching chapters by group", err));
        }
    };
    getChapterInfo = async (req, res) => {
        try {
            const { chapterName } = req.params;
            const userId = req.user;
            if (!chapterName)
                return res.status(400).json(new ApiError_1.default("chapterName is required"));
            let chapterRecord;
            try {
                chapterRecord = await chapter_db_1.chapter.gettingChapterId(chapterName);
            }
            catch (err) {
                return res
                    .status(404)
                    .json(new ApiError_1.default(`Chapter "${chapterName}" not found. Verify the chapter name.`, err));
            }
            const stats = await chapterWisePractice_db_1.chapterWisePractice.getChapterInfo(chapterRecord.id, userId);
            return res.status(200).json(new ApiResponse_1.default("Chapter Stats fetched", {
                chapterId: chapterRecord.id,
                chapterName: chapterRecord.name,
                ...stats,
            }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error fetching chapter stats", err));
        }
    };
    getQuestionAttemptsHistory = async (req, res) => {
        try {
            const { questionId } = req.params;
            const userId = req.user;
            if (!questionId)
                return res.status(400).json(new ApiError_1.default("questionId is required"));
            const history = await chapterWisePractice_db_1.chapterWisePractice.getQuestionAttemptsHistory(questionId, userId);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Question history fetched", history));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error fetching question history", err));
        }
    };
    updateTimeSpentStatus = async (req, res) => {
        try {
            const { questionId } = req.params;
            const userId = req.user;
            const { status, timeSpent, userAnswer } = req.body;
            const payload = {
                studentId: userId,
                questionId,
                status: status || client_1.AttemptStatus.notAnswered,
                timeSpent: timeSpent || 0,
                userAnswer: userAnswer || [],
            };
            await chapterWiseCacheService_1.chapterWiseCacheService.upsertAttemptData(userId, questionId, payload);
            await updateChapterAttempt_producer_1.updateChapterAttemptProducer.updateAttemptData(payload);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Question progress updated continuously", payload));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error updating progress continuously", err));
        }
    };
    submitImmediateEvaluate = async (req, res) => {
        try {
            const { questionId } = req.params;
            const userId = req.user;
            const { status, timeSpent, userAnswerRaw, } = req.body;
            const studentId = req.user;
            const result = await questionEvalutionService_1.practiceQuestionEvaluation.evaluate({
                questionId: questionId,
                userAnswer: userAnswerRaw || [],
                timeSpent: timeSpent || 0,
                created_at: new Date()
            });
            const payload = {
                studentId: userId,
                questionId,
                status: status || client_1.AttemptStatus.answered,
                timeSpent: timeSpent || 0,
                userAnswer: userAnswerRaw || [],
                isCorrect: result.verdict === "correct",
                marksObtained: result.marks,
            };
            if (result.verdict === "correct") {
                await uniqueCountService_1.questionBitmapRegistry.markAttempted(studentId, questionId);
            }
            await chapterWiseCacheService_1.chapterWiseCacheService.upsertAttemptData(userId, questionId, payload);
            await submitChapterAttempt_producer_1.submitChapterAttemptProducer.submitAttemptData(payload);
            return res.status(200).json(new ApiResponse_1.default("Question submitted and evaluated", {
                marksObtained: result.marks,
                verdict: result.verdict,
                isCorrect: result.verdict === "correct",
            }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error evaluating answer", err));
        }
    };
}
exports.chapterWiseController = new ChapterWiseController();
