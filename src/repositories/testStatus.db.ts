import { AttemptStatus, PrismaClient, TestState } from "@prisma/client";
import { database } from "../lib/database";
import { updatingDetails } from "../types/testStatus.types";
import { encryptPayload } from "../utils/encryption";
import { question } from "./question.db";

class TestStatus {
    private db: PrismaClient;

    constructor(database: PrismaClient) {
        this.db = database;
    }

    // =================================================================
    // API 1: SESSION MANAGEMENT
    // =================================================================
    async startNewTestSession(
        userId: string,
        paperId: string,
        totalTime: number = 10800
    ) {
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

        } catch (err) {
            console.error("Error in startNewTestSession:", err);
            throw err;
        }
    }

    // =================================================================
    // API 2: DATA FETCHING (Updated for Subject -> Section Structure)
    // =================================================================
    async getSessionData(testStatusId: string, userId: string) {
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
            const rawPaperData: any = await question.getRawQuestionsForPaper(currentTestStatus.paperId);
            
            if (!rawPaperData) throw new Error("Paper data not found");

            // 4. Create Map for O(1) Access
            const attemptMap = new Map();
            userAttempts.forEach(att => attemptMap.set(att.questionId, att));

            // 5. Helper: Recursively traverse object to find arrays of questions
            const mergeAttemptsRecursive = (data: any): any => {
                // Base Case: If data is an array, it's a list of questions. Process it.
                if (Array.isArray(data)) {
                    return data.map((q: any) => {
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
                                status: AttemptStatus.notAnswered
                            }
                        };
                    });
                }

                // Recursive Step: If data is an object (e.g., "Physics", "MultiCorrect"), traverse its keys
                if (data && typeof data === 'object') {
                    const newData: any = {};
                    for (const key in data) {
                        if (key === 'paperDetails') {
                             newData[key] = data[key]; // Skip processing paper details
                        } else {
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

        } catch (err) {
            console.error("Error in getSessionData:", err);
            throw err;
        }
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private async startingNewTest(userId: string, paperId: string, created_at: Date, time: number) {
        return await this.db.testStatus.create({
            data: {
                userId,
                paperId,
                status: TestState.IN_PROGRESS,
                created_at,
                updated_at: created_at,
                paperOver: false,
                timeLeft: time
            }
        });
    }

    private async resumeTest(testStatusId: string) {
        await this.db.testStatus.update({
            where: { id: testStatusId },
            data: { status: TestState.IN_PROGRESS }
        });
    }

    async gettingAllTestDetails(userId: string, paperId: string) {
        return await this.db.testStatus.findMany({
            where: { paperId, userId },
            orderBy: { created_at: 'desc' }
        });
    }

    // =================================================================
    // 3. UPDATING TEST DETAILS
    // =================================================================
    async updatingTestDetails(updateDetails: updatingDetails) {
        try {
            const testId = updateDetails.testId;

            // ---------------------------------------------------------
            // 🛑 1. SAFETY CHECK: Prevent P2025 (Record Not Found)
            // ---------------------------------------------------------
            // We check if the test exists first. If the frontend sends an update
            // for a test that hasn't finished creating yet (race condition), 
            // we skip this update instead of crashing the server.
            const existingTest = await this.db.testStatus.findUnique({
                where: { id: testId }
            });

            if (!existingTest) {
                console.warn(`⚠️ Skipped update: TestID ${testId} not found in database.`);
                return null; 
            }

            // ---------------------------------------------------------
            // 🚀 2. INTERACTIVE TRANSACTION (Fixes P2028 Timeout)
            // ---------------------------------------------------------
            const result = await this.db.$transaction(async (tx) => {

                // A. Update Parent (Use 'tx' instead of 'this.db')
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

                // B. Prepare Question Upserts
                // specific logic: We create an array of promises to run in parallel
                const questionPromises = updateDetails.questionStatus.map((q: any) => {
                    let formattedAnswer: string[] = [];

                    // --- LOGIC FIX: Handle Numeric vs Options correctly ---
                    // Priority 1: Numeric Answer
                    if (q.numericAnswer !== null && q.numericAnswer !== undefined && q.numericAnswer !== '') {
                        formattedAnswer.push(String(q.numericAnswer));
                    }
                    // Priority 2: Selected Options (Only if no numeric answer)
                    else if (q.selectedOptionIds !== null && Array.isArray(q.selectedOptionIds) && q.selectedOptionIds.length > 0) {
                        formattedAnswer = q.selectedOptionIds.map(String);
                    }
                    // Fallback: If payload sent 'userAnswer' directly (legacy support)
                    else if (q.userAnswer !== null && q.userAnswer !== undefined) {
                         if (Array.isArray(q.userAnswer)) {
                            formattedAnswer = q.userAnswer.map(String);
                        } else {
                            formattedAnswer = [String(q.userAnswer)];
                        }
                    }

                    // Use 'tx' here as well!
                    return tx.testQuestionAttemptStatus.upsert({
                        where: {
                            questionId_testStatusId: {
                                questionId: q.questionId,
                                testStatusId: testId!
                            }
                        },
                        create: {
                            testStatusId: testId!,
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

                // C. Execute all question updates
                await Promise.all(questionPromises);

                // D. Return the parent update result
                return updateParent;

            }, {
                // TIMEOUT CONFIGURATION
                maxWait: 5000,  // Wait max 5s to get a connection from the pool
                timeout: 20000  // Allow the transaction to run for 20s
            });

            return result;

        } catch (err) {
            console.error("Error updating test details:", err);
            // Optional: Don't throw if it's just a record not found error to keep the consumer running
            // if (err.code === 'P2025') return null; 
            throw err;
        }
    }
    // =================================================================
    // 4. SUBMIT TEST
    // =================================================================
    async submitTest(testStatusId: string) {
        try {
            const completedTest = await this.db.testStatus.update({
                where: { id: testStatusId },
                data: {
                    status: TestState.COMPLETED,
                    paperOver: true,
                    updated_at: new Date()
                }
            });
            
            return { message: "Test Submitted Successfully", testId: completedTest.id };
        } catch (err) {
            console.error("Error submitting test:", err);
            throw err;
        }
    }

    // =================================================================
    // 5. WATCHDOG
    // =================================================================
    async autoPauseInactiveTests(inactivityThresholdSeconds: number) {
        try {
            const cutoffTime = new Date(Date.now() - (inactivityThresholdSeconds * 1000));

            const result = await this.db.testStatus.updateMany({
                where: {
                    status: TestState.IN_PROGRESS,
                    updated_at: { lt: cutoffTime },
                    paperOver: false
                },
                data: {
                    status: TestState.PAUSED
                }
            });

            if (result.count > 0) {
                console.log(`Watchdog: Auto-paused ${result.count} tests.`);
            }

            return result.count;
        } catch (err) {
            console.error("Error in auto-pausing inactive tests:", err);
        }
    }

}

export const testStatus = new TestStatus(database);