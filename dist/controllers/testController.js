"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testController = void 0;
const updateTestDetails_producer_1 = require("../rabbitmq/producers/updateTestDetails-producer");
const testStatus_db_1 = require("../repositories/testStatus.db");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const client_1 = require("@prisma/client");
const testEvalution_producer_1 = require("../rabbitmq/producers/testEvalution-producer");
const testEvaluationService_1 = require("../services/testEvaluationService");
const caching_1 = require("../lib/caching");
const reddisService_1 = require("../services/reddisService");
class TestController {
    constructor() { }
    // ── Creating new test ────────────────────────────────────────────
    createTestStatus = async (req, res) => {
        const { paperId } = req.body;
        const userId = req.user;
        try {
            const testStatusDetails = await testStatus_db_1.testStatus.startNewTestSession(userId, paperId);
            return res.status(200).json(new ApiResponse_1.default("Test Details", testStatusDetails));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in Creating Test", err));
        }
    };
    // ── Getting questions + merging Redis cache on top ───────────────
    gettingQuestionAndDetails = async (req, res) => {
        const { testStatusId, created_at } = req.query;
        const userId = req.user;
        const createdAtStr = String(created_at ?? "");
        try {
            const dbSessionData = await testStatus_db_1.testStatus.getSessionData(testStatusId, userId);
            if (!dbSessionData) {
                return res.status(404).json(new ApiError_1.default("Test session not found"));
            }
            // ── Try Redis cache first ────────────────────────────────
            const cachedUpdateData = await reddisService_1.reddisService.getTestUpdateDataFromReddis(userId, testStatusId, createdAtStr);
            // ── Redis MISS — return pure DB data ─────────────────────
            if (!cachedUpdateData) {
                console.log(`⚠️ Redis MISS for testId: ${testStatusId}, returning DB data`);
                return res.status(200).json(new ApiResponse_1.default("Your question + test result", dbSessionData));
            }
            console.log(`✅ Redis HIT for testId: ${testStatusId}, merging with DB questions`);
            // ── Build lookup map from Redis attempts ─────────────────
            const redisAttemptMap = new Map();
            (cachedUpdateData.questionStatus || []).forEach((q) => {
                redisAttemptMap.set(q.questionId, q);
            });
            // ── Merge Redis attempts into DB question arrays ──────────
            const mergeSubject = (questions) => {
                if (!Array.isArray(questions))
                    return questions;
                return questions.map((q) => {
                    const redisAttempt = redisAttemptMap.get(q.id);
                    if (!redisAttempt)
                        return q;
                    return {
                        ...q,
                        attemptStatus: {
                            userAnswer: redisAttempt.userAnswer ?? null,
                            isVisited: redisAttempt.isVisited ?? false,
                            markedForReview: redisAttempt.markedForReview ?? false,
                            timeSpent: redisAttempt.timeSpent ?? 0,
                            status: redisAttempt.status ?? client_1.AttemptStatus.notAnswered,
                        },
                    };
                });
            };
            const mergedPayload = {
                session: {
                    testId: testStatusId,
                    timeLeft: cachedUpdateData.timeLeft ?? dbSessionData.session.timeLeft,
                    activeSection: cachedUpdateData.activeSection ?? dbSessionData.session.activeSection,
                    activeQuestionId: cachedUpdateData.activeQuestionId ?? dbSessionData.session.activeQuestionId,
                    status: cachedUpdateData.state ?? dbSessionData.session.status,
                    startTime: dbSessionData.session.startTime,
                },
                paper: dbSessionData.paper,
                Physics: mergeSubject(dbSessionData.Physics),
                Chemistry: mergeSubject(dbSessionData.Chemistry),
                Mathematics: mergeSubject(dbSessionData.Mathematics),
            };
            return res.status(200).json(new ApiResponse_1.default("Your question + test result", mergedPayload));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting question details", err));
        }
    };
    // ── Saving in-progress update → queue + Redis ────────────────────
    updatingTheDetails = async (req, res) => {
        const { testId, paperId, timeLeft, created_at, timeStamp, state, activeSection, activeQuestionId, questionsById } = req.body;
        const userId = req.user;
        const createdAtStr = String(created_at ?? "");
        try {
            const questionStatusArray = Object.values(questionsById || {}).map((q) => ({
                isVisited: q.isVisited,
                markedForReview: q.markedForReview,
                questionId: q.questionId,
                userAnswer: q.userAnswer,
                timeSpent: q.timeSpentSeconds || 0,
                status: q.status === client_1.AttemptStatus.answered
                    ? client_1.AttemptStatus.answered
                    : client_1.AttemptStatus.notAnswered,
            }));
            const details = {
                testId,
                userId,
                paperId,
                timeLeft,
                activeQuestionId,
                activeSection,
                created_at,
                timeStamp,
                state,
                questionStatus: questionStatusArray,
            };
            // ── Push to queue AND cache in Redis in parallel ──────────
            await Promise.all([
                updateTestDetails_producer_1.updatingTestDetailsProducer.updateData(details),
                reddisService_1.reddisService.upsertTestUpdateData(userId, testId, createdAtStr, details),
            ]);
            return res.status(200).json(new ApiResponse_1.default("Pushed in queue"));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in updating the details", err));
        }
    };
    // ── Last test session of the user with the paper ─────────────────
    LastTestDetails = async (req, res) => {
        const { paperId } = req.query;
        const userId = req.user;
        try {
            const testStatusDetails = await testStatus_db_1.testStatus.gettingAllTestDetails(userId, paperId);
            let payload;
            if (testStatusDetails.length === 0) {
                payload = {};
            }
            else {
                payload = {
                    status: testStatusDetails[0].status,
                    created_at: testStatusDetails[0].created_at,
                    testId: testStatusDetails[0].id,
                };
            }
            return res.status(200).json(new ApiResponse_1.default("Last Test Data", payload));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting Details", err));
        }
    };
    // ── Submitting the test → evaluate + write analytics cache ───────
    submitTest = async (req, res) => {
        const { testId, paperId, timeLeft, created_at, timeStamp, state, activeSection, activeQuestionId, questionsById } = req.body;
        const userId = req.user;
        const created_at_string = String(created_at ?? "");
        try {
            const questionStatusArray = Object.values(questionsById || {}).map((q) => ({
                isVisited: q.isVisited,
                markedForReview: q.markedForReview,
                questionId: q.questionId,
                userAnswer: q.userAnswer,
                timeSpent: q.timeSpentSeconds || 0,
                status: q.status === client_1.AttemptStatus.answered
                    ? client_1.AttemptStatus.answered
                    : client_1.AttemptStatus.notAnswered,
            }));
            const details = {
                testId,
                userId,
                paperId,
                timeLeft,
                activeQuestionId,
                activeSection,
                created_at,
                timeStamp,
                state,
                questionStatus: questionStatusArray,
            };
            const testEvaluate = await testEvaluationService_1.testEvaluation.evaluation(details, userId);
            let gettingUserUpperLayer = await caching_1.reddisConfigForCaching.gettingAnanlyticsData(`${userId}:testUpperLayer`);
            if (!gettingUserUpperLayer) {
                gettingUserUpperLayer = { testId: [] };
            }
            const dataToInsert = {
                id: testId,
                created_at: created_at_string,
            };
            gettingUserUpperLayer.testId.push(dataToInsert);
            // ── Persist analytics + clean up in-progress cache ────────
            await Promise.all([
                caching_1.reddisConfigForCaching.settingAnanlyticsData(`${userId}:testUpperLayer`, gettingUserUpperLayer),
                caching_1.reddisConfigForCaching.settingAnanlyticsData(`${userId}:${testId}:${created_at_string}`, testEvaluate),
                reddisService_1.reddisService.deleteTestUpdateData(userId, testId),
            ]);
            console.log("CONTROLLER created_at_string:", created_at_string);
            await testEvalution_producer_1.testEvaluationProducer.evaluateTheData({
                testId,
                studentId: userId,
                created_at: created_at_string,
                report: testEvaluate,
            });
            return res.status(200).json(new ApiResponse_1.default("Test submitted successfully", testEvaluate));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in submitting the test", err));
        }
    };
}
exports.testController = new TestController();
