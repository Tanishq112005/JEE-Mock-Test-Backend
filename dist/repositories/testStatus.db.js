"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testStatus = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../lib/database");
class TestStatus {
    db;
    constructor(database) {
        this.db = database;
    }
    // Adding the new test 
    async startingNewTest(userId, paperId, created_at, time) {
        try {
            // 1. Check if a test session already exists
            // We reuse the method we just created, which returns tests sorted by newest first.
            const allTheTestDetails = await this.gettingAllTestDetails(userId, paperId);
            if (allTheTestDetails.length > 0) {
                const latestTest = allTheTestDetails[0];
                // Case A: A previous test was paused. Delete it to allow a restart.
                if (latestTest.status === client_1.TestState.PAUSED) {
                    await this.db.testStatus.delete({
                        where: {
                            id: latestTest.id
                        }
                    });
                }
                // Case B: A test is currently live. Block the user.
                else if (latestTest.status === client_1.TestState.IN_PROGRESS) {
                    throw new Error("Your Test Is Currently In Progress. Please complete it or pause it before starting a new one.");
                }
            }
            // 2. Create the new test session in the db 
            const adding = await this.db.testStatus.create({
                data: {
                    userId: userId,
                    paperId: paperId,
                    status: client_1.TestState.IN_PROGRESS,
                    created_at: created_at,
                    updated_at: created_at,
                    paperOver: false,
                    timeLeft: time
                }
            });
            return adding;
        }
        catch (err) {
            // Log the error for debugging purposes before throwing
            console.error("Error starting new test:", err);
            throw err;
        }
    }
    // updating the test status details 
    async updatingTestDetails(updateDetails) {
        try {
            const existingTest = await this.db.testStatus.findFirst({
                where: {
                    userId: updateDetails.userId,
                    paperId: updateDetails.paperId,
                    created_at: updateDetails.created_at
                }
            });
            if (!existingTest) {
                throw new Error("Active Test Session not found. Please check userId, paperId, and timeStamp.");
            }
            const updateParent = this.db.testStatus.update({
                where: { id: existingTest.id },
                data: {
                    timeLeft: updateDetails.timeLeft,
                    activeSection: updateDetails.activeSection,
                    activeQuestionId: updateDetails.activeQuestionId,
                    updated_at: updateDetails.timeStamp,
                    status: updateDetails.state
                }
            });
            const updateQuestions = updateDetails.questionStatus.map((q) => {
                return this.db.testQuestionAttemptStatus.upsert({
                    where: {
                        questionId_testStatusId: {
                            questionId: q.questionId,
                            testStatusId: existingTest.id
                        }
                    },
                    create: {
                        testStatusId: existingTest.id,
                        questionId: q.questionId,
                        isVisited: q.isVisited,
                        markedForReview: q.markedForReview,
                        timeSpent: q.timeSpent,
                        userAnswer: q.userAnswer,
                        status: client_1.AttemptStatus.ATTEMPTING
                    },
                    update: {
                        isVisited: q.isVisited,
                        markedForReview: q.markedForReview,
                        timeSpent: q.timeSpent,
                        userAnswer: q.userAnswer,
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
    // getting all the live test or the pause  for the specific paper 
    async gettingAllTestDetails(userId, paperId) {
        try {
            const allTheTestDetails = await this.db.testStatus.findMany({
                where: {
                    paperId: paperId,
                    userId: userId
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            return allTheTestDetails;
        }
        catch (err) {
            console.error("Error in getting all the test details", err);
            throw err;
        }
    }
    // removing the pause test , if the user wants to start the new test for the specific paper 
    // getting all the questions status for the specific created_at , test , completed
    async gettingTestDetails(testStatusId) {
        try {
            const testDetails = await this.db.testStatus.findUnique({
                where: {
                    id: testStatusId
                },
                include: {
                    testQuestionStatus: {
                        orderBy: {
                            questionId: 'asc'
                        }
                    }
                }
            });
            if (!testDetails) {
                throw new Error("Test Details Not Found");
            }
            return testDetails;
        }
        catch (err) {
            console.error("Error in getting test details:", err);
            throw err;
        }
    }
    // after the times over then the test automatically goes in the queue for getting the analyitics stored in the db and all 
    // watchdog , continusly checking if the test time should we need to puase or not 
    async autoPauseInactiveTests(inactivityThresholdSeconds) {
        try {
            // Calculate the time boundary: "Now minus 60 seconds"
            const cutoffTime = new Date(Date.now() - (inactivityThresholdSeconds * 1000));
            // Find and update all tests that are IN_PROGRESS but haven't updated since the cutoffTime
            const result = await this.db.testStatus.updateMany({
                where: {
                    status: client_1.TestState.IN_PROGRESS,
                    updated_at: {
                        lt: cutoffTime
                    },
                    paperOver: false
                },
                data: {
                    status: client_1.TestState.PAUSED
                }
            });
            if (result.count > 0) {
                console.log(`Watchdog: Auto-paused ${result.count} tests due to inactivity/internet loss.`);
            }
            return result.count;
        }
        catch (err) {
            console.error("Error in auto-pausing inactive tests:", err);
        }
    }
}
exports.testStatus = new TestStatus(database_1.database);
