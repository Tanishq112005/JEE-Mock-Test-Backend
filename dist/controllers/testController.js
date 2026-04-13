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
const dashboardCacheService_1 = require("../services/dashboardCacheService");
const paper_db_1 = require("../repositories/paper.db");
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
            const cachedUpdateData = await dashboardCacheService_1.dashboardCacheService.getTestUpdateDataFromReddis(userId, testStatusId, createdAtStr);
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
                dashboardCacheService_1.dashboardCacheService.upsertTestUpdateData(userId, testId, createdAtStr, details),
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
                let latestStatus = testStatusDetails[0].status;
                // ── Verify against Redis in case it's still processing as COMPLETED ──
                if (latestStatus === 'IN_PROGRESS' || latestStatus === 'PAUSED') {
                    try {
                        const upperLayer = await caching_1.cacheService.getCache(`${userId}:testUpperLayer`);
                        if (upperLayer && Array.isArray(upperLayer.testId)) {
                            const isCompleted = upperLayer.testId.some((t) => t.id === testStatusDetails[0].id);
                            if (isCompleted) {
                                latestStatus = 'COMPLETED';
                            }
                        }
                    }
                    catch (err) {
                        console.error("Error fetching redis upper layer in LastTestDetails:", err);
                    }
                }
                payload = {
                    status: latestStatus,
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
            const questionStatusArray = Object.values(questionsById || {}).map((q) => {
                let formattedAnswer = [];
                if (q.numericAnswer !== null &&
                    q.numericAnswer !== undefined &&
                    q.numericAnswer !== "") {
                    formattedAnswer.push(String(q.numericAnswer));
                }
                else if (Array.isArray(q.selectedOptionIds) &&
                    q.selectedOptionIds.length > 0) {
                    formattedAnswer = q.selectedOptionIds.map(String);
                }
                else if (q.userAnswer !== null &&
                    q.userAnswer !== undefined) {
                    formattedAnswer = Array.isArray(q.userAnswer)
                        ? q.userAnswer.map(String)
                        : [String(q.userAnswer)];
                }
                return {
                    isVisited: q.isVisited,
                    markedForReview: q.markedForReview,
                    questionId: q.questionId,
                    userAnswer: formattedAnswer,
                    timeSpent: q.timeSpentSeconds || 0,
                    status: q.status === client_1.AttemptStatus.answered
                        ? client_1.AttemptStatus.answered
                        : client_1.AttemptStatus.notAnswered,
                };
            });
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
            if (!testEvaluate) {
                return res.status(400).json(new ApiError_1.default("Evaluation failed. Cannot submit test."));
            }
            let gettingUserUpperLayer = await caching_1.cacheService.getCache(`${userId}:testUpperLayer`);
            if (!gettingUserUpperLayer || !Array.isArray(gettingUserUpperLayer.testId)) {
                gettingUserUpperLayer = { testId: [] };
            }
            const dataToInsert = {
                id: testId,
                created_at: created_at_string,
            };
            gettingUserUpperLayer.testId.push(dataToInsert);
            // ── Persist analytics + clean up in-progress cache ────────
            await Promise.all([
                caching_1.cacheService.setCache(`${userId}:testUpperLayer`, gettingUserUpperLayer),
                caching_1.cacheService.setCache(`${userId}:${testId}:${created_at_string}`, testEvaluate),
                dashboardCacheService_1.dashboardCacheService.deleteTestUpdateData(userId, testId),
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
    // getting the details of the last test session
    // ── Getting all papers for a year+exam with attempt status ──────────
    getPapersWithStatus = async (req, res) => {
        const { examName, year } = req.query;
        const userId = req.user;
        try {
            if (!examName || !year) {
                return res.status(400).json(new ApiError_1.default("examName and year are required"));
            }
            const parsedYear = parseInt(year, 10);
            if (isNaN(parsedYear)) {
                return res.status(400).json(new ApiError_1.default("year must be a valid number"));
            }
            // ── Step 1: Get all papers for this exam + year ──────────────
            const papers = await paper_db_1.paper.gettingPaperInformation(parsedYear, examName);
            if (!papers || papers.length === 0) {
                return res.status(200).json(new ApiResponse_1.default("No papers found for this exam and year", []));
            }
            const paperIds = papers.map((p) => p.id);
            // ── Step 2: Get all testStatus rows for this student + these papers ──
            // One query for all papers at once — no N+1
            const allTestSessions = await testStatus_db_1.testStatus.gettingAllTestDetailsForPapers(userId, paperIds);
            // ── Check Redis Analytics UpperLayer for recent test submissions ──
            let upperLayer = null;
            try {
                upperLayer = await caching_1.cacheService.getCache(`${userId}:testUpperLayer`);
            }
            catch (err) {
                console.error("Error fetching redis upper layer:", err);
            }
            const completedTestIds = new Set(upperLayer && Array.isArray(upperLayer.testId)
                ? upperLayer.testId.map((t) => t.id)
                : []);
            // ── Step 3: Group sessions by paperId ────────────────────────
            // A student may have multiple attempts on the same paper
            const sessionsByPaper = {};
            for (const session of allTestSessions) {
                // Override status if completed in Redis
                let currentStatus = session.status;
                if ((currentStatus === 'IN_PROGRESS' || currentStatus === 'PAUSED') && completedTestIds.has(session.id)) {
                    currentStatus = 'COMPLETED';
                }
                session.status = currentStatus;
                if (!sessionsByPaper[session.paperId]) {
                    sessionsByPaper[session.paperId] = [];
                }
                sessionsByPaper[session.paperId].push(session);
            }
            // ── Step 4: Build response — one entry per paper ─────────────
            const result = papers.map((p) => {
                const sessions = sessionsByPaper[p.id] ?? [];
                // Sort sessions newest first
                sessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const latestSession = sessions[0] ?? null;
                // Derive overall attempt status for this paper
                let attemptStatus = 'not_attempted';
                if (latestSession) {
                    if (latestSession.status === 'COMPLETED') {
                        attemptStatus = 'completed';
                    }
                    else if (latestSession.status === 'IN_PROGRESS' ||
                        latestSession.status === 'PAUSED') {
                        attemptStatus = 'in_progress';
                    }
                }
                return {
                    // ── Paper details ────────────────────────────────────
                    paperId: p.id,
                    examName: examName,
                    year: p.year,
                    month: p.month,
                    day: p.day,
                    date: p.date,
                    shift: p.shift,
                    mode: p.mode,
                    totalMarks: p.totalMarks,
                    totalDuration: p.totalDuration,
                    totalQuestions: p.totalQuestions,
                    // ── Attempt status ───────────────────────────────────
                    attemptStatus,
                    totalAttempts: sessions.length,
                    // Latest attempt info (null if never attempted)
                    latestAttempt: latestSession
                        ? {
                            testId: latestSession.id,
                            status: latestSession.status,
                            isAnalyzed: latestSession.isAnalyzed,
                            createdAt: latestSession.created_at,
                            timeLeft: latestSession.timeLeft,
                        }
                        : null,
                    // All attempts (newest first)
                    allAttempts: sessions.map((s) => ({
                        testId: s.id,
                        status: s.status,
                        isAnalyzed: s.isAnalyzed,
                        createdAt: s.created_at,
                        timeLeft: s.timeLeft,
                    })),
                };
            });
            return res.status(200).json(new ApiResponse_1.default("Papers with attempt status", result));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting papers with status", err));
        }
    };
}
exports.testController = new TestController();
