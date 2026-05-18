"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testStatus = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../lib/database");
const question_db_1 = require("./question.db");
class TestStatus {
    db;
    constructor(database) {
        this.db = database;
    }
    // =================================================================
    // API 1: SESSION MANAGEMENT
    // =================================================================
    async startNewTestSession(userId, paperId, totalTime = 10800) {
        try {
            const existingTests = await this.gettingAllTestDetails(userId, paperId);
            const latestTest = existingTests[0];
            if (latestTest &&
                (latestTest.status === "IN_PROGRESS" || latestTest.status == "PAUSED")) {
                await this.db.testStatus.delete({
                    where: { id: latestTest.id },
                });
            }
            const newTest = await this.startingNewTest(userId, paperId, new Date(), totalTime);
            return {
                testId: newTest.id,
                status: newTest.status,
                message: "New Test Started Successfully",
            };
        }
        catch (err) {
            console.error("Error in startNewTestSession:", err);
            throw err;
        }
    }
    // =================================================================
    // API 2: DATA FETCHING (Updated for Subject -> Section Structure)
    // =================================================================
    async getSessionData(testStatusId, userId) {
        try {
            // 1. Fetch Test Session
            const currentTestStatus = await this.db.testStatus.findUnique({
                where: { id: testStatusId },
            });
            if (!currentTestStatus) {
                throw new Error("Test Session not found");
            }
            if (currentTestStatus.studentId !== userId) {
                throw new Error("Unauthorized access to this test session");
            }
            // 2. Fetch User Attempts
            const userAttempts = await this.db.testQuestionAttemptStatus.findMany({
                where: { testStatusId: testStatusId },
            });
            // 3. Fetch Raw Questions
            const rawPaperData = await question_db_1.question.getRawQuestionsForPaper(currentTestStatus.paperId, userId);
            if (!rawPaperData)
                throw new Error("Paper data not found");
            // 4. Create Map for O(1) Access
            const attemptMap = new Map();
            userAttempts.forEach((att) => attemptMap.set(att.questionId, att));
            // 5. Helper: Recursively traverse object to find arrays of questions
            const mergeAttemptsRecursive = (data) => {
                if (Array.isArray(data)) {
                    return data.map((q) => {
                        const userAttempt = attemptMap.get(q.id);
                        return {
                            ...q,
                            attemptStatus: userAttempt
                                ? {
                                    userAnswer: userAttempt.userAnswer,
                                    isVisited: userAttempt.isVisited,
                                    markedForReview: userAttempt.markedForReview,
                                    timeSpent: userAttempt.timeSpent,
                                    status: userAttempt.status,
                                }
                                : {
                                    userAnswer: null,
                                    isVisited: false,
                                    markedForReview: false,
                                    timeSpent: 0,
                                    status: client_1.AttemptStatus.notAnswered,
                                },
                        };
                    });
                }
                if (data && typeof data === "object") {
                    const newData = {};
                    for (const key in data) {
                        if (key === "paperDetails") {
                            newData[key] = data[key];
                        }
                        else {
                            newData[key] = mergeAttemptsRecursive(data[key]);
                        }
                    }
                    return newData;
                }
                return data;
            };
            // 6. Process Subjects
            const processedPhysics = mergeAttemptsRecursive(rawPaperData.Physics);
            const processedChemistry = mergeAttemptsRecursive(rawPaperData.Chemistry);
            const processedMathematics = mergeAttemptsRecursive(rawPaperData.Mathematics);
            // 7. Construct Final Payload
            const finalPayload = {
                session: {
                    testId: currentTestStatus.id,
                    timeLeft: currentTestStatus.timeLeft,
                    activeSection: currentTestStatus.activeSection,
                    activeQuestionId: currentTestStatus.activeQuestionId,
                    status: currentTestStatus.status,
                    startTime: currentTestStatus.created_at,
                },
                paper: rawPaperData.paperDetails,
                Physics: processedPhysics,
                Chemistry: processedChemistry,
                Mathematics: processedMathematics,
            };
            return finalPayload;
        }
        catch (err) {
            console.error("Error in getSessionData:", err);
            throw err;
        }
    }
    // =================================================================
    // HELPER METHODS
    // =================================================================
    async startingNewTest(userId, paperId, created_at, time) {
        return await this.db.testStatus.create({
            data: {
                studentId: userId,
                paperId,
                status: client_1.TestState.IN_PROGRESS,
                created_at,
                updated_at: created_at,
                timeLeft: time,
            },
        });
    }
    async resumeTest(testStatusId) {
        await this.db.testStatus.update({
            where: { id: testStatusId },
            data: { status: client_1.TestState.IN_PROGRESS },
        });
    }
    async gettingAllTestDetails(userId, paperId) {
        return await this.db.testStatus.findMany({
            where: {
                paperId: paperId,
                studentId: userId,
            },
            orderBy: { created_at: "desc" },
        });
    }
    // =================================================================
    // 3. UPDATING TEST DETAILS
    // =================================================================
    async updatingTestDetails(updateDetails) {
        try {
            const existingTest = await this.db.testStatus.findUnique({
                where: { id: updateDetails.testId },
            });
            if (!existingTest) {
                console.warn(`⚠️ Skipped: TestID ${updateDetails.testId} not found.`);
                return null;
            }
            const studentId = existingTest.studentId;
            await this.db.$transaction(async (tx) => {
                // ── Update parent test state ─────────────────────────────
                await tx.testStatus.update({
                    where: { id: updateDetails.testId },
                    data: {
                        timeLeft: updateDetails.timeLeft,
                        activeSection: updateDetails.activeSection,
                        activeQuestionId: updateDetails.activeQuestionId,
                        updated_at: new Date(),
                        status: updateDetails.state,
                    },
                });
                // ── Upsert all questions from frontend ───────────────────
                if (updateDetails.questionStatus?.length > 0) {
                    await Promise.all(updateDetails.questionStatus.map((q) => {
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
                        return tx.testQuestionAttemptStatus.upsert({
                            where: {
                                questionId_testStatusId: {
                                    questionId: q.questionId,
                                    testStatusId: updateDetails.testId,
                                },
                            },
                            create: {
                                testStatusId: updateDetails.testId,
                                questionId: q.questionId,
                                studentId,
                                timeSpent: q.timeSpent || 0,
                                userAnswer: formattedAnswer,
                                status: q.status || "notAnswered",
                                isVisited: q.isVisited || false,
                                markedForReview: q.markedForReview || false,
                            },
                            update: {
                                timeSpent: q.timeSpent || 0,
                                userAnswer: formattedAnswer,
                                status: q.status || "notAnswered",
                                isVisited: q.isVisited || false,
                                markedForReview: q.markedForReview || false,
                            },
                        });
                    }));
                }
            }, { maxWait: 5000, timeout: 20000 });
            console.log(`✅ Updated ${updateDetails.questionStatus?.length ?? 0} questions for test ${updateDetails.testId}`);
            return true;
        }
        catch (err) {
            console.error("❌ updatingTestDetails failed:", err);
            throw err;
        }
    }
    async gettingTestDetails(testStatusId) {
        try {
            const testContext = await this.db.testStatus.findUnique({
                where: { id: testStatusId },
                include: {
                    testQuestionStatus: {
                        include: {
                            questions: true,
                        },
                    },
                    papers: {
                        include: {
                            markingSchemes: true,
                        },
                    },
                },
            });
            return testContext;
        }
        catch (err) {
            throw err;
        }
    }
    // =================================================================
    // 4. FINAL SUBMIT TEST
    // =================================================================
    async finalSubmitTest(testId, studentId, created_at, evaluationReport) {
        try {
            const existingTest = await this.db.testStatus.findUnique({
                where: { id: testId },
            });
            if (!existingTest)
                throw new Error(`TestID ${testId} not found`);
            const finalVerdict = evaluationReport.finalVerdict ?? [];
            await this.db.$transaction(async (tx) => {
                // ── 1. Mark testStatus as COMPLETED ─────────────────────
                await tx.testStatus.update({
                    where: { id: testId },
                    data: {
                        status: "COMPLETED",
                        updated_at: new Date(),
                    },
                });
                // ── 2. Upsert every question with full evaluation data ───
                await Promise.all(finalVerdict.map((q) => {
                    const isCorrect = q.verdict === "correct";
                    return tx.testQuestionAttemptStatus.upsert({
                        where: {
                            questionId_testStatusId: {
                                questionId: q.questionId,
                                testStatusId: testId,
                            },
                        },
                        create: {
                            testStatusId: testId,
                            questionId: q.questionId,
                            studentId,
                            timeSpent: q.timeSpent || 0,
                            userAnswer: q.userAnswer || [],
                            status: q.isVisited
                                ? q.userAnswer?.length > 0 ? "answered" : "visited"
                                : "notAnswered",
                            isVisited: q.isVisited || false,
                            markedForReview: q.markedForReview || false,
                            isCorrect: isCorrect,
                            marksObtained: q.marks || 0,
                            isAnalyzed: true,
                        },
                        update: {
                            timeSpent: q.timeSpent || 0,
                            userAnswer: q.userAnswer || [],
                            status: q.isVisited
                                ? q.userAnswer?.length > 0 ? "answered" : "visited"
                                : "notAnswered",
                            isVisited: q.isVisited || false,
                            markedForReview: q.markedForReview || false,
                            isCorrect: isCorrect,
                            marksObtained: q.marks || 0,
                            isAnalyzed: true,
                            updated_at: new Date(),
                        },
                    });
                }));
            }, { maxWait: 10000, timeout: 30000 });
            console.log(`✅ finalSubmitTest complete — ${finalVerdict.length} questions saved for test ${testId}`);
            return true;
        }
        catch (err) {
            console.error("❌ finalSubmitTest failed:", err);
            throw err;
        }
    }
    // =================================================================
    // 5. WATCHDOG
    // =================================================================
    async autoPauseInactiveTests(inactivityThresholdSeconds) {
        try {
            const cutoffTime = new Date(Date.now() - inactivityThresholdSeconds * 1000);
            const result = await this.db.testStatus.updateMany({
                where: {
                    status: client_1.TestState.IN_PROGRESS,
                    updated_at: { lt: cutoffTime },
                },
                data: {
                    status: client_1.TestState.PAUSED,
                },
            });
            if (result.count > 0) {
                console.log(`Watchdog: Auto-paused ${result.count} tests.`);
            }
            return result.count;
        }
        catch (err) {
            console.error("Error in auto-pausing inactive tests:", err);
        }
    }
    // =================================================================
    // 6. GET ALL TEST DETAILS FOR MULTIPLE PAPERS (newest attempt first)
    // =================================================================
    async gettingAllTestDetailsForPapers(studentId, paperIds) {
        try {
            return await this.db.testStatus.findMany({
                where: {
                    studentId,
                    paperId: { in: paperIds },
                },
                select: {
                    id: true,
                    paperId: true,
                    status: true,
                    timeLeft: true,
                    isAnalyzed: true,
                    created_at: true,
                },
                orderBy: { created_at: "desc" }, // newest attempt first
            });
        }
        catch (err) {
            throw err;
        }
    }
}
exports.testStatus = new TestStatus(database_1.database);
