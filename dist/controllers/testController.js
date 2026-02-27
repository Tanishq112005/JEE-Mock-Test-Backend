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
// ─────────────────────────────────────────────────────────────────────────────
// Helper: build the questionStatusArray from questionsById (used in 2 routes)
// ─────────────────────────────────────────────────────────────────────────────
function buildQuestionStatusArray(questionsById) {
    return (questionsById || []).map((q) => ({
        isVisited: q.isVisited,
        markedForReview: q.markedForReview,
        questionId: q.questionId,
        userAnswer: q.userAnswer,
        timeSpent: q.timeSpentSeconds || 0,
        status: q.status === client_1.AttemptStatus.answered
            ? client_1.AttemptStatus.answered
            : client_1.AttemptStatus.notAnswered,
    }));
}
// ─────────────────────────────────────────────────────────────────────────────
// Helper: merge Redis attempt data into a flat array of question objects
// Instead of a risky deep-recursive approach, we handle each subject directly
// ─────────────────────────────────────────────────────────────────────────────
function mergeSubjectWithRedis(subjectQuestions, redisAttemptMap) {
    if (!Array.isArray(subjectQuestions))
        return subjectQuestions;
    return subjectQuestions.map((q) => {
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
}
class TestController {
    constructor() { }
    createTestStatus = async (req, res) => {
        const { paperId } = req.body;
        const userId = req.user;
        try {
            const testStatusDetails = await testStatus_db_1.testStatus.startNewTestSession(userId, paperId);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Test Details", testStatusDetails));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in Creating Test", err));
        }
    };
    // ───────────────────────────────────────────────────────────────────────────
    // GET — fetch question data, merging Redis cache on top of DB baseline
    // ───────────────────────────────────────────────────────────────────────────
    gettingQuestionAndDetails = async (req, res) => {
        const { testStatusId, created_at } = req.query;
        const userId = req.user;
        // Normalise created_at to string immediately (protects Redis key consistency)
        const createdAtStr = String(created_at ?? "");
        if (!testStatusId) {
            return res.status(400).json(new ApiError_1.default("testStatusId is required"));
        }
        try {
            // 1. Always pull the DB baseline (questions, paper structure, session meta)
            const dbSessionData = await testStatus_db_1.testStatus.getSessionData(testStatusId, userId);
            if (!dbSessionData) {
                return res.status(404).json(new ApiError_1.default("Test session not found"));
            }
            // 2. Try to pull the latest in-progress state from Redis
            const cachedUpdateData = await reddisService_1.reddisService.getTestUpdateDataFromReddis(userId, testStatusId, createdAtStr);
            // 3. Redis MISS → return pure DB data
            if (!cachedUpdateData) {
                console.log(`⚠️ Redis MISS for testId: ${testStatusId}, returning DB data`);
                return res
                    .status(200)
                    .json(new ApiResponse_1.default("Your question + test result", dbSessionData));
            }
            console.log(`✅ Redis HIT for testId: ${testStatusId}, merging with DB questions`);
            // 4. Build a lookup map from Redis attempt data  { questionId → attempt }
            const redisAttemptMap = new Map();
            (cachedUpdateData.questionStatus || []).forEach((q) => {
                redisAttemptMap.set(q.questionId, q);
            });
            // 5. Merge Redis attempts into each subject array from DB
            //    (flat per-subject merge — no risky deep recursion)
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
                Physics: mergeSubjectWithRedis(dbSessionData.Physics, redisAttemptMap),
                Chemistry: mergeSubjectWithRedis(dbSessionData.Chemistry, redisAttemptMap),
                Mathematics: mergeSubjectWithRedis(dbSessionData.Mathematics, redisAttemptMap),
            };
            return res
                .status(200)
                .json(new ApiResponse_1.default("Your question + test result", mergedPayload));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in getting question details", err));
        }
    };
    // ───────────────────────────────────────────────────────────────────────────
    // POST — save in-progress updates to RabbitMQ queue AND Redis cache
    // ───────────────────────────────────────────────────────────────────────────
    updatingTheDetails = async (req, res) => {
        const { testId, paperId, timeLeft, created_at, timeStamp, state, activeSection, activeQuestionId, questionsById, } = req.body;
        const userId = req.user;
        // ── Normalise created_at to string here (single source of truth) ──────────
        const createdAtStr = String(created_at ?? "");
        try {
            const questionStatusArray = buildQuestionStatusArray(questionsById);
            const details = {
                testId,
                userId,
                paperId,
                timeLeft,
                activeQuestionId,
                activeSection,
                created_at, // keep original type for DB/queue compatibility
                timeStamp,
                state,
                questionStatus: questionStatusArray,
            };
            // ── Fire-and-forget: queue write + Redis cache write in parallel ────────
            await Promise.all([
                updateTestDetails_producer_1.updatingTestDetailsProducer.updateData(details),
                // Pass normalised string so Redis key always matches what the GET reads
                reddisService_1.reddisService.upsertTestUpdateData(userId, testId, createdAtStr, details),
            ]);
            return res.status(200).json(new ApiResponse_1.default("Pushed in queue"));
        }
        catch (err) {
            console.error(err);
            return res
                .status(500)
                .json(new ApiError_1.default("Error in updating the details", err));
        }
    };
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
            return res
                .status(500)
                .json(new ApiError_1.default("Error in getting Details", err));
        }
    };
    // ───────────────────────────────────────────────────────────────────────────
    // POST — submit final test, evaluate, write analytics cache, clean update cache
    // ───────────────────────────────────────────────────────────────────────────
    submitTest = async (req, res) => {
        const { testId, paperId, timeLeft, created_at, timeStamp, state, activeSection, activeQuestionId, questionsById, } = req.body;
        const userId = req.user;
        const created_at_string = String(created_at ?? "");
        try {
            const questionStatusArray = buildQuestionStatusArray(questionsById);
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
            // ── Persist analytics cache + clean up the in-progress update cache ─────
            await Promise.all([
                caching_1.reddisConfigForCaching.settingAnanlyticsData(`${userId}:testUpperLayer`, gettingUserUpperLayer),
                caching_1.reddisConfigForCaching.settingAnanlyticsData(`${userId}:${testId}:${created_at_string}`, testEvaluate),
                // Remove the in-progress update data now that the test is submitted
                reddisService_1.reddisService.deleteTestUpdateData(userId, testId),
            ]);
            console.log("CONTROLLER created_at_string:", created_at_string);
            await testEvalution_producer_1.testEvaluationProducer.evaluateTheData({
                testId,
                studentId: userId,
                created_at: created_at_string,
                report: testEvaluate,
            });
            return res
                .status(200)
                .json(new ApiResponse_1.default("Test submitted successfully", testEvaluate));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in submitting the test", err));
        }
    };
}
exports.testController = new TestController();
