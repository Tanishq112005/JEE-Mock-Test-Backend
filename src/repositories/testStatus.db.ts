import { AttemptStatus, PrismaClient, TestState } from "@prisma/client";
import { database } from "../lib/database";
import { updatingDetails } from "../types/testStatus.types";
import { encryptPayload } from "../utils/encryption";
import { question } from "./question.db";
 // Ensure this points to your Paper/Question DB file

class TestStatus {
    private db: PrismaClient;

    constructor(database: PrismaClient) {
        this.db = database;
    }

    // =================================================================
    // API 1: SESSION MANAGEMENT (Create / Resume / Block)
    // Use this for the "Start Test" button.
    // Returns plain JSON: { testId, status, message }
    // =================================================================
    async startNewTestSession(
        userId: string,
        paperId: string,
        totalTime: number = 10800 // Default 3 hours
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

        } catch (err) {
            console.error("Error in startNewTestSession:", err);
            throw err;
        }
    }

    // =================================================================
    // API 2: DATA FETCHING (Get Questions + User Attempts)
    // Use this for the "Loading Screen" after you have the testId.
    // Returns: Encrypted Payload
    // =================================================================
    async getSessionData(testStatusId: string, userId: string) {
        try {
            // 1. Fetch the Test Session to get PaperID and verify owner
            const currentTestStatus = await this.db.testStatus.findUnique({
                where: { id: testStatusId },
            });

            if (!currentTestStatus) {
                throw new Error("Test Session not found");
            }

            // Security Check
            if (currentTestStatus.userId !== userId) {
                throw new Error("Unauthorized access to this test session");
            }

            // 2. Fetch User Attempts for this specific session
            const userAttempts = await this.db.testQuestionAttemptStatus.findMany({
                where: { testStatusId: testStatusId }
            });

            // 3. Fetch Raw Questions from Paper DB (Using your Question Class)
            // Note: Ensure `question.getRawQuestionsForPaper` is implemented as discussed previously
            const rawPaperData = await question.getRawQuestionsForPaper(currentTestStatus.paperId);
            
            if (!rawPaperData) throw new Error("Paper data not found");

            // 4. Merge Logic (Optimize with Map)
            const attemptMap = new Map();
            userAttempts.forEach(att => attemptMap.set(att.questionId, att));

            const mergedQuestions = rawPaperData.questions.map((q) => {
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
                        status: AttemptStatus.notAnswered
                    }
                };
            });

            // 5. Construct Final Payload
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
                questions: mergedQuestions
            };

            // 6. Encrypt
            return finalPayload;

        } catch (err) {
            console.error("Error in getSessionData:", err);
            throw err;
        }
    }

    // =================================================================
    // HELPER METHODS (Internal & Background)
    // =================================================================

    // Helper: Create entry in DB
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

    // Helper: Set status to IN_PROGRESS
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

    // 3. UPDATING TEST DETAILS (Syncs frontend state to DB)
    // This is called periodically (e.g., every 5-10 seconds or on answer change)
   // In src/repositories/testStatus.db.ts

    // 2. UPDATING TEST DETAILS (Syncs frontend state to DB)
   async updatingTestDetails(updateDetails: updatingDetails) {
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
            const updateQuestions = updateDetails.questionStatus.map((q : any) => {
                
                // --- FIX: Format userAnswer as String[] for Prisma ---
                let formattedAnswer: string[] = [];
                if (q.userAnswer !== null && q.userAnswer !== undefined) {
                    if (Array.isArray(q.userAnswer)) {
                        formattedAnswer = q.userAnswer.map(String);
                    } else {
                        formattedAnswer = [String(q.userAnswer)];
                    }
                }
                // ----------------------------------------------------

                return this.db.testQuestionAttemptStatus.upsert({
                    where: {
                        questionId_testStatusId: {
                            questionId: q.questionId,
                            testStatusId: testId!
                        }
                    },
                    create: {
                        testStatusId: testId!,
                        questionId: q.questionId,
                        timeSpent: q.timeSpent,
                        userAnswer: formattedAnswer, 
                        status: q.status , 
                    },
                    update: {
                        timeSpent: q.timeSpent,
                        userAnswer: formattedAnswer,
                        status : q.status , 
                        isVisited : q.isVisited , 
                        markedForReview : q.markedForReview
                        
                    }
                });
            });

            // 3. Execute Transaction
            const result = await this.db.$transaction([
                updateParent,
                ...updateQuestions
            ]);

            return result[0];
        } catch (err) {
            console.error("Error updating test details:", err);
            throw err;
        }
    }
    // 4. SUBMIT TEST
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

            // Trigger Analytics Worker here...
            
            return { message: "Test Submitted Successfully", testId: completedTest.id };
        } catch (err) {
            console.error("Error submitting test:", err);
            throw err;
        }
    }

    // 5. WATCHDOG (Auto-pause inactive tests)
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