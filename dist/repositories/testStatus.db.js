"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testStatus = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../lib/database");
const question_db_1 = require("./question.db");
// Ensure this points to your Paper/Question DB file
class TestStatus {
    db;
    constructor(database) {
        this.db = database;
    }
    // =================================================================
    // API 1: SESSION MANAGEMENT (Create / Resume / Block)
    // Use this for the "Start Test" button.
    // Returns plain JSON: { testId, status, message }
    // =================================================================
    async startNewTestSession(userId, paperId, totalTime = 10800 // Default 3 hours
    ) {
        try {
            // 1. Check history (Get latest session)
            const existingTests = await this.gettingAllTestDetails(userId, paperId);
            const latestTest = existingTests[0];
            // 2. CLEANUP: If there is an unfinished test, DELETE IT.
            // This handles both 'PAUSED' and 'IN_PROGRESS' states automatically.
            if (latestTest && !latestTest.paperOver) {
                // Optional: If your Prisma schema does not have 'onDelete: Cascade', 
                // uncomment the line below to delete attempts first.
                // await this.db.testQuestionAttemptStatus.deleteMany({ where: { testStatusId: latestTest.id } });
                await this.db.testStatus.delete({
                    where: { id: latestTest.id }
                });
            }
            // 3. CREATE: Start a fresh session
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
    // API 2: DATA FETCHING (Get Questions + User Attempts)
    // Use this for the "Loading Screen" after you have the testId.
    // Returns: Encrypted Payload
    // =================================================================
    async getSessionData(testStatusId, userId) {
        try {
            // 1. Fetch the Test Session
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
            // 3. Fetch Raw Questions (Subject-wise Object)
            // Returns: { paperDetails, Physics: [], Chemistry: [], Mathematics: [] }
            const rawPaperData = await question_db_1.question.getRawQuestionsForPaper(currentTestStatus.paperId);
            if (!rawPaperData)
                throw new Error("Paper data not found");
            // 4. Create Map for O(1) Access
            const attemptMap = new Map();
            userAttempts.forEach(att => attemptMap.set(att.questionId, att));
            // 5. Helper Function to Merge Attempts
            const mergeAttempts = (questions) => {
                if (!questions || !Array.isArray(questions))
                    return [];
                return questions.map((q) => {
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
                            // Default Empty State
                            userAnswer: null,
                            isVisited: false,
                            markedForReview: false,
                            timeSpent: 0,
                            status: client_1.AttemptStatus.notAnswered
                        }
                    };
                });
            };
            // 6. Process Each Subject Individually
            const processedPhysics = mergeAttempts(rawPaperData.Physics);
            const processedChemistry = mergeAttempts(rawPaperData.Chemistry);
            const processedMathematics = mergeAttempts(rawPaperData.Mathematics);
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
                // Return subject keys instead of a single 'questions' array
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
    // HELPER METHODS (Internal & Background)
    // =================================================================
    // Helper: Create entry in DB
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
    // Helper: Set status to IN_PROGRESS
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
    // 3. UPDATING TEST DETAILS (Syncs frontend state to DB)
    // This is called periodically (e.g., every 5-10 seconds or on answer change)
    // In src/repositories/testStatus.db.ts
    // 2. UPDATING TEST DETAILS (Syncs frontend state to DB)
    async updatingTestDetails(updateDetails) {
        try {
            let testId = updateDetails.testId;
            let existingTest;
            // Strategy A: ID Lookup (Fastest & Best)
            existingTest = await this.db.testStatus.findUnique({
                where: { id: testId }
            });
            // 1. Update Parent (Timer, Status)
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
                // --- FIX: Format userAnswer as String[] for Prisma ---
                let formattedAnswer = [];
                if (q.userAnswer !== null && q.userAnswer !== undefined) {
                    if (Array.isArray(q.userAnswer)) {
                        formattedAnswer = q.userAnswer.map(String);
                    }
                    else {
                        formattedAnswer = [String(q.userAnswer)];
                    }
                }
                // ----------------------------------------------------
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
            // 3. Execute Transaction
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
    // 4. SUBMIT TEST
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
            // Trigger Analytics Worker here...
            return { message: "Test Submitted Successfully", testId: completedTest.id };
        }
        catch (err) {
            console.error("Error submitting test:", err);
            throw err;
        }
    }
    // 5. WATCHDOG (Auto-pause inactive tests)
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
