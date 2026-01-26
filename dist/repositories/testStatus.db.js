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
            if (latestTest && !latestTest.paperOver) {
                // await this.db.testQuestionAttemptStatus.deleteMany({ where: { testStatusId: latestTest.id } });
                await this.db.testStatus.delete({
                    where: { id: latestTest.id }
                });
            }
            const newTest = await this.startingNewTest(userId, paperId, new Date(), totalTime);
            return {
                testId: newTest.id,
                status: newTest.status,
                message: "New Test Started Successfully"
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
            if (currentTestStatus.userId !== userId) {
                throw new Error("Unauthorized access to this test session");
            }
            // 2. Fetch User Attempts
            const userAttempts = await this.db.testQuestionAttemptStatus.findMany({
                where: { testStatusId: testStatusId }
            });
            // 3. Fetch Raw Questions
            // Structure: { paperDetails, Physics: { MultiCorrect: [], ... }, Chemistry: { ... }, ... }
            const rawPaperData = await question_db_1.question.getRawQuestionsForPaper(currentTestStatus.paperId);
            if (!rawPaperData)
                throw new Error("Paper data not found");
            // 4. Create Map for O(1) Access
            const attemptMap = new Map();
            userAttempts.forEach(att => attemptMap.set(att.questionId, att));
            // 5. Helper: Recursively traverse object to find arrays of questions
            const mergeAttemptsRecursive = (data) => {
                // Base Case: If data is an array, it's a list of questions. Process it.
                if (Array.isArray(data)) {
                    return data.map((q) => {
                        const userAttempt = attemptMap.get(q.id);
                        return {
                            ...q,
                            attemptStatus: userAttempt ? {
                                userAnswer: userAttempt.userAnswer,
                                isVisited: userAttempt.isVisited,
                                markedForReview: userAttempt.markedForReview,
                                timeSpent: userAttempt.timeSpent,
                                status: userAttempt.status
                            } : {
                                userAnswer: null,
                                isVisited: false,
                                markedForReview: false,
                                timeSpent: 0,
                                status: client_1.AttemptStatus.notAnswered
                            }
                        };
                    });
                }
                // Recursive Step: If data is an object (e.g., "Physics", "MultiCorrect"), traverse its keys
                if (data && typeof data === 'object') {
                    const newData = {};
                    for (const key in data) {
                        if (key === 'paperDetails') {
                            newData[key] = data[key]; // Skip processing paper details
                        }
                        else {
                            newData[key] = mergeAttemptsRecursive(data[key]);
                        }
                    }
                    return newData;
                }
                return data;
            };
            // 6. Process Subjects (Physics, Chemistry, Mathematics)
            // This will automatically handle the nested MultiCorrect/SingleCorrect/Integer structure
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
                    paperOver: currentTestStatus.paperOver
                },
                paper: rawPaperData.paperDetails,
                Physics: processedPhysics,
                Chemistry: processedChemistry,
                Mathematics: processedMathematics
            };
            // 8. Encrypt
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
                userId,
                paperId,
                status: client_1.TestState.IN_PROGRESS,
                created_at,
                updated_at: created_at,
                paperOver: false,
                timeLeft: time
            }
        });
    }
    async resumeTest(testStatusId) {
        await this.db.testStatus.update({
            where: { id: testStatusId },
            data: { status: client_1.TestState.IN_PROGRESS }
        });
    }
    async gettingAllTestDetails(userId, paperId) {
        return await this.db.testStatus.findMany({
            where: { paperId, userId },
            orderBy: { created_at: 'desc' }
        });
    }
    // =================================================================
    // 3. UPDATING TEST DETAILS
    // =================================================================
    async updatingTestDetails(updateDetails) {
        try {
            let testId = updateDetails.testId;
            // 1. Update Parent
            const updateParent = this.db.testStatus.update({
                where: { id: testId },
                data: {
                    timeLeft: updateDetails.timeLeft,
                    activeSection: updateDetails.activeSection,
                    activeQuestionId: updateDetails.activeQuestionId,
                    updated_at: new Date(),
                    status: updateDetails.state
                }
            });
            // 2. Upsert Questions
            const updateQuestions = updateDetails.questionStatus.map((q) => {
                let formattedAnswer = [];
                if (q.userAnswer !== null && q.userAnswer !== undefined) {
                    if (Array.isArray(q.userAnswer)) {
                        formattedAnswer = q.userAnswer.map(String);
                    }
                    else {
                        formattedAnswer = [String(q.userAnswer)];
                    }
                }
                return this.db.testQuestionAttemptStatus.upsert({
                    where: {
                        questionId_testStatusId: {
                            questionId: q.questionId,
                            testStatusId: testId
                        }
                    },
                    create: {
                        testStatusId: testId,
                        questionId: q.questionId,
                        timeSpent: q.timeSpent,
                        userAnswer: formattedAnswer,
                        status: q.status,
                    },
                    update: {
                        timeSpent: q.timeSpent,
                        userAnswer: formattedAnswer,
                        status: q.status,
                        isVisited: q.isVisited,
                        markedForReview: q.markedForReview
                    }
                });
            });
            const result = await this.db.$transaction([
                updateParent,
                ...updateQuestions
            ]);
            return result[0];
        }
        catch (err) {
            console.error("Error updating test details:", err);
            throw err;
        }
    }
    // =================================================================
    // 4. SUBMIT TEST
    // =================================================================
    async submitTest(testStatusId) {
        try {
            const completedTest = await this.db.testStatus.update({
                where: { id: testStatusId },
                data: {
                    status: client_1.TestState.COMPLETED,
                    paperOver: true,
                    updated_at: new Date()
                }
            });
            return { message: "Test Submitted Successfully", testId: completedTest.id };
        }
        catch (err) {
            console.error("Error submitting test:", err);
            throw err;
        }
    }
    // =================================================================
    // 5. WATCHDOG
    // =================================================================
    async autoPauseInactiveTests(inactivityThresholdSeconds) {
        try {
            const cutoffTime = new Date(Date.now() - (inactivityThresholdSeconds * 1000));
            const result = await this.db.testStatus.updateMany({
                where: {
                    status: client_1.TestState.IN_PROGRESS,
                    updated_at: { lt: cutoffTime },
                    paperOver: false
                },
                data: {
                    status: client_1.TestState.PAUSED
                }
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
}
exports.testStatus = new TestStatus(database_1.database);
