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
const encryption_1 = require("../utils/encryption");
const redis_1 = require("../lib/redis");
class ChapterWiseController {
    constructor() { }
    groupName = async (req, res) => {
        try {
            let { subjectName } = req.query;
            if (!subjectName ||
                !Object.values(client_1.SubjectName).includes(subjectName)) {
                return res.status(400).json(new ApiError_1.default("Invalid subject name"));
            }
            const redisKey = redis_1.redisConfig.getRedisGroupName(subjectName);
            const cachedGroups = await redis_1.questionRedisclient.get(redisKey);
            if (cachedGroups) {
                console.log(`[Cache Hit] Group data for "${subjectName}" coming from Redis.`);
                return res
                    .status(200)
                    .json(new ApiResponse_1.default(`Group Of the ${subjectName} are: `, (0, encryption_1.encryptPayload)(JSON.parse(cachedGroups))));
            }
            console.log(`[Cache Miss] Group data for "${subjectName}" coming from Database.`);
            const finalResponse = await chapter_db_1.chapter.gettingDetailedGroups(subjectName);
            await redis_1.questionRedisclient.setEx(redisKey, redis_1.REDIS_CACHE_EXPIRATION, JSON.stringify(finalResponse));
            return res
                .status(200)
                .json(new ApiResponse_1.default(`Group Of the ${subjectName} are: `, (0, encryption_1.encryptPayload)(finalResponse)));
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
            const redisKey = redis_1.redisConfig.getRedisChaptersByGroup(groupName);
            const cachedChapters = await redis_1.questionRedisclient.get(redisKey);
            if (cachedChapters) {
                console.log(`[Cache Hit] Chapters for group "${groupName}" coming from Redis.`);
                return res
                    .status(200)
                    .json(new ApiResponse_1.default(`Chapters for group ${groupName}`, (0, encryption_1.encryptPayload)(JSON.parse(cachedChapters))));
            }
            console.log(`[Cache Miss] Chapters for group "${groupName}" coming from Database.`);
            const chapters = await chapter_db_1.chapter.gettingChapter({ group: groupName });
            await redis_1.questionRedisclient.setEx(redisKey, redis_1.REDIS_CACHE_EXPIRATION, JSON.stringify(chapters));
            return res
                .status(200)
                .json(new ApiResponse_1.default(`Chapters for group ${groupName}`, (0, encryption_1.encryptPayload)(chapters)));
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
                return res.status(400).json(new ApiError_1.default("ChapterName is required"));
            let chapterRecord;
            const redisKey = redis_1.redisConfig.getRedisChapterDataUsingChapterName(chapterName);
            const cachedChapter = await redis_1.questionRedisclient.get(redisKey);
            if (cachedChapter) {
                console.log(`[Cache Hit] Chapter info for "${chapterName}" coming from Redis.`);
                chapterRecord = JSON.parse(cachedChapter);
            }
            else {
                console.log(`[Cache Miss] Chapter info for "${chapterName}" coming from Database.`);
                try {
                    chapterRecord = await chapter_db_1.chapter.gettingChapterId(chapterName);
                    await redis_1.questionRedisclient.setEx(redisKey, redis_1.REDIS_CACHE_EXPIRATION, JSON.stringify(chapterRecord));
                }
                catch (err) {
                    return res
                        .status(404)
                        .json(new ApiError_1.default(`Chapter "${chapterName}" not found. Verify the chapter name.`, err));
                }
            }
            const stats = await chapterWisePractice_db_1.chapterWisePractice.getChapterInfo(chapterRecord.id, userId);
            return res.status(200).json(new ApiResponse_1.default("Chapter Stats fetched", (0, encryption_1.encryptPayload)({
                chapterId: chapterRecord.id,
                chapterName: chapterRecord.name,
                isJeeMain: chapterRecord.isJeeMain,
                isJeeAdvanced: chapterRecord.isJeeAdvanced,
                isCbse: chapterRecord.isCbse,
                ...stats,
            })));
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
                .json(new ApiResponse_1.default("Question history fetched", (0, encryption_1.encryptPayload)(history)));
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
            const { status, timeSpent, userAnswer, userAnswerRaw, numericAnswer, selectedOptionIds } = req.body;
            let formattedAnswer = [];
            if (numericAnswer !== null && numericAnswer !== undefined && numericAnswer !== "") {
                formattedAnswer.push(String(numericAnswer));
            }
            else if (Array.isArray(selectedOptionIds) && selectedOptionIds.length > 0) {
                formattedAnswer = selectedOptionIds.map(String);
            }
            else if (userAnswer !== null && userAnswer !== undefined) {
                formattedAnswer = Array.isArray(userAnswer) ? userAnswer.map(String) : [String(userAnswer)];
            }
            else if (userAnswerRaw !== null && userAnswerRaw !== undefined) {
                formattedAnswer = Array.isArray(userAnswerRaw) ? userAnswerRaw.map(String) : [String(userAnswerRaw)];
            }
            const payload = {
                studentId: userId,
                questionId,
                status: status || client_1.AttemptStatus.notAnswered,
                timeSpent: timeSpent || 0,
                userAnswer: formattedAnswer,
            };
            await chapterWiseCacheService_1.chapterWiseCacheService.upsertAttemptData(userId, questionId, payload);
            await updateChapterAttempt_producer_1.updateChapterAttemptProducer.updateAttemptData(payload);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Question progress updated continuously", (0, encryption_1.encryptPayload)(payload)));
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
            const { status, timeSpent, userAnswerRaw, numericAnswer, selectedOptionIds, userAnswer } = req.body;
            const studentId = req.user;
            let formattedAnswer = [];
            if (numericAnswer !== null && numericAnswer !== undefined && numericAnswer !== "") {
                formattedAnswer.push(String(numericAnswer));
            }
            else if (Array.isArray(selectedOptionIds) && selectedOptionIds.length > 0) {
                formattedAnswer = selectedOptionIds.map(String);
            }
            else if (userAnswer !== null && userAnswer !== undefined) {
                formattedAnswer = Array.isArray(userAnswer) ? userAnswer.map(String) : [String(userAnswer)];
            }
            else if (userAnswerRaw !== null && userAnswerRaw !== undefined) {
                formattedAnswer = Array.isArray(userAnswerRaw) ? userAnswerRaw.map(String) : [String(userAnswerRaw)];
            }
            const result = await questionEvalutionService_1.practiceQuestionEvaluation.evaluate({
                questionId: questionId,
                userAnswer: formattedAnswer,
                timeSpent: timeSpent || 0,
                created_at: new Date()
            });
            const isActuallyCorrect = result.verdict && String(result.verdict).toLowerCase() === "correct";
            console.log(`[Submit] Evaluated Question ${questionId}. Verdict: "${result.verdict}". Parsed as Correct: ${isActuallyCorrect}`);
            console.log(isActuallyCorrect);
            if (isActuallyCorrect) {
                console.log(`[Submit] Marking question as attempted in Redis Bitmap...`);
                const f = await uniqueCountService_1.questionBitmapRegistry.markAttempted(studentId, questionId);
                console.log(f);
                console.log(`[Submit] Successfully marked in Redis Bitmap.`);
            }
            const payload = {
                studentId: userId,
                questionId,
                status: status || client_1.AttemptStatus.answered,
                timeSpent: timeSpent || 0,
                userAnswer: formattedAnswer,
                isCorrect: isActuallyCorrect, // Use the safe boolean
                marksObtained: result.marks,
                verdict: result.verdict,
                positiveMarks: result.positiveMarks,
                negativeMarks: result.negativeMarks,
                type: result.type,
                subjectId: result.subjectId,
                chapterId: result.chapterId,
                examName: result.examName,
            };
            await chapterWiseCacheService_1.chapterWiseCacheService.upsertAttemptData(userId, questionId, payload);
            await submitChapterAttempt_producer_1.submitChapterAttemptProducer.submitAttemptData(payload);
            return res.status(200).json(new ApiResponse_1.default("Question submitted and evaluated", (0, encryption_1.encryptPayload)({
                marksObtained: result.marks,
                verdict: result.verdict,
                isCorrect: isActuallyCorrect,
            })));
        }
        catch (err) {
            console.error("[Submit] Evaluation Error:", err);
            return res.status(500).json(new ApiError_1.default("Error evaluating answer", err));
        }
    };
}
exports.chapterWiseController = new ChapterWiseController();
