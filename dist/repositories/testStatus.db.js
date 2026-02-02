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
            const testId = updateDetails.testId;
            // 1. SAFETY CHECK
            const existingTest = await this.db.testStatus.findUnique({
                where: { id: testId }
            });
            if (!existingTest) {
                console.warn(`⚠️ Skipped: TestID ${testId} not found.`);
                return null;
            }
            // 🛑 2. THE CRITICAL FIX: FILTERING
            // Only update questions that have data worth saving.
            // This reduces the load from ~75 queries to ~1-3 queries.
            const activeQuestions = updateDetails.questionStatus.filter((q) => q.questionId === updateDetails.activeQuestionId || // Always update the current question
                q.isVisited === true || // Update if user visited it
                q.status === 'answered' || // Update if answered
                q.status === 'markedForReview' // Update if marked
            );
            // 3. TRANSACTION
            const result = await this.db.$transaction(async (tx) => {
                // A. Update Parent
                const updateParent = await tx.testStatus.update({
                    where: { id: testId },
                    data: {
                        timeLeft: updateDetails.timeLeft,
                        activeSection: updateDetails.activeSection,
                        activeQuestionId: updateDetails.activeQuestionId,
                        updated_at: new Date(),
                        status: updateDetails.state
                    }
                });
                // B. Upsert ONLY Active Questions (Using the filtered list)
                const questionPromises = activeQuestions.map((q) => {
                    let formattedAnswer = [];
                    // Answer formatting logic...
                    if (q.numericAnswer !== null && q.numericAnswer !== undefined && q.numericAnswer !== '') {
                        formattedAnswer.push(String(q.numericAnswer));
                    }
                    else if (q.selectedOptionIds !== null && Array.isArray(q.selectedOptionIds) && q.selectedOptionIds.length > 0) {
                        formattedAnswer = q.selectedOptionIds.map(String);
                    }
                    else if (q.userAnswer !== null && q.userAnswer !== undefined) {
                        if (Array.isArray(q.userAnswer)) {
                            formattedAnswer = q.userAnswer.map(String);
                        }
                        else {
                            formattedAnswer = [String(q.userAnswer)];
                        }
                    }
                    return tx.testQuestionAttemptStatus.upsert({
                        where: {
                            questionId_testStatusId: {
                                questionId: q.questionId,
                                testStatusId: testId
                            }
                        },
                        create: {
                            testStatusId: testId,
                            questionId: q.questionId,
                            timeSpent: q.timeSpent || 0,
                            userAnswer: formattedAnswer,
                            status: q.status,
                        },
                        update: {
                            timeSpent: q.timeSpent || 0,
                            userAnswer: formattedAnswer,
                            status: q.status,
                            isVisited: q.isVisited,
                            markedForReview: q.markedForReview
                        }
                    });
                });
                await Promise.all(questionPromises);
                return updateParent;
            }, {
                maxWait: 5000,
                timeout: 20000
            });
            console.log(`✅ Success! Updated ${activeQuestions.length} questions.`);
            return result;
        }
        catch (err) {
            console.error("❌ Transaction Failed:", err);
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
