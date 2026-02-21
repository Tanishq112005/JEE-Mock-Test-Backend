import { AttemptStatus, PrismaClient, questionType, TestState } from "@prisma/client";
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

            if (latestTest && (latestTest.status === 'IN_PROGRESS' || latestTest.status == 'PAUSED')) {
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

            if (currentTestStatus.studentId !== userId) {
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
                    startTime: currentTestStatus.created_at
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
                studentId: userId,
                paperId,
                status: TestState.IN_PROGRESS,
                created_at,
                updated_at: created_at,
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
            where: {
                paperId: paperId,
                studentId: userId
            },
            orderBy: { created_at: 'desc' }
        });
    }


    // =================================================================
    // 3. UPDATING TEST DETAILS
    // =================================================================
    async updatingTestDetails(updateDetails: updatingDetails) {
    try {
        const existingTest = await this.db.testStatus.findUnique({
            where: { id: updateDetails.testId }
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
                    timeLeft:         updateDetails.timeLeft,
                    activeSection:    updateDetails.activeSection,
                    activeQuestionId: updateDetails.activeQuestionId,
                    updated_at:       new Date(),
                    status:           updateDetails.state,
                },
            });

            // ── Upsert all questions from frontend ───────────────────
            if (updateDetails.questionStatus?.length > 0) {
                await Promise.all(updateDetails.questionStatus.map((q: any) => {
                    let formattedAnswer: string[] = [];

                    if (q.numericAnswer !== null && q.numericAnswer !== undefined && q.numericAnswer !== '') {
                        formattedAnswer.push(String(q.numericAnswer));
                    } else if (Array.isArray(q.selectedOptionIds) && q.selectedOptionIds.length > 0) {
                        formattedAnswer = q.selectedOptionIds.map(String);
                    } else if (q.userAnswer !== null && q.userAnswer !== undefined) {
                        formattedAnswer = Array.isArray(q.userAnswer)
                            ? q.userAnswer.map(String)
                            : [String(q.userAnswer)];
                    }

                    return tx.testQuestionAttemptStatus.upsert({
                        where: {
                            questionId_testStatusId: {
                                questionId:   q.questionId,
                                testStatusId: updateDetails.testId,
                            },
                        },
                        create: {
                            testStatusId:    updateDetails.testId,
                            questionId:      q.questionId,
                            studentId,
                            timeSpent:       q.timeSpent       || 0,
                            userAnswer:      formattedAnswer,
                            status:          q.status          || 'notAnswered',
                            isVisited:       q.isVisited        || false,
                            markedForReview: q.markedForReview  || false,
                        },
                        update: {
                            timeSpent:       q.timeSpent       || 0,
                            userAnswer:      formattedAnswer,
                            status:          q.status          || 'notAnswered',
                            isVisited:       q.isVisited        || false,
                            markedForReview: q.markedForReview  || false,
                        },
                    });
                }));
            }

        }, { maxWait: 5000, timeout: 20000 });

        console.log(`✅ Updated ${updateDetails.questionStatus?.length ?? 0} questions for test ${updateDetails.testId}`);
        return true;

    } catch (err) {
        console.error("❌ updatingTestDetails failed:", err);
        throw err;
    }
}


    async gettingTestDetails(testStatusId: string) {
        try {
            const testContext = await this.db.testStatus.findUnique({
                where: { id: testStatusId },
                include: {
                    testQuestionStatus: {
                        include: {
                            questions: true // Contains correctAnswer, type, etc.
                        }
                    },
                    papers: {
                        include: {
                            markingSchemes: true // Contains Partial Marking Rules
                        }
                    }
                }
            });

            return testContext;
        }
        catch (err: any) {
            throw err;
        }


    }
     
    // finalSumbmitTest 
    
    async finalSubmitTest(
    testId:           string,
    studentId:        string,
    created_at:       Date,
    evaluationReport: any,   // full summaryReport from testEvaluation.evaluation()
) {
    try {
        const existingTest = await this.db.testStatus.findUnique({
            where: { id: testId },
        });

        if (!existingTest) throw new Error(`TestID ${testId} not found`);

        // ── Pull finalVerdict from the full report ───────────────────
        const finalVerdict: any[] = evaluationReport.finalVerdict ?? [];

        await this.db.$transaction(async (tx) => {

            // ── 1. Mark testStatus as COMPLETED ─────────────────────
            await tx.testStatus.update({
                where: { id: testId },
                data: {
                    status:     'COMPLETED',
                    updated_at: new Date(),
                },
            });

            // ── 2. Upsert every question with full evaluation data ───
            await Promise.all(finalVerdict.map((q: any) => {
                const isCorrect = q.verdict === 'correct';

                return tx.testQuestionAttemptStatus.upsert({
                    where: {
                        questionId_testStatusId: {
                            questionId:   q.questionId,
                            testStatusId: testId,
                        },
                    },
                    create: {
                        testStatusId:    testId,
                        questionId:      q.questionId,
                        studentId,
                        timeSpent:       q.timeSpent        || 0,
                        userAnswer:      q.userAnswer       || [],
                        status:          q.isVisited
                            ? (q.userAnswer?.length > 0 ? 'answered' : 'visited')
                            : 'notAnswered',
                        isVisited:       q.isVisited         || false,
                        markedForReview: q.markedForReview   || false,
                        isCorrect:       isCorrect,
                        marksObtained:   q.marks             || 0,
                        isAnalyzed:      true,
                    },
                    update: {
                        timeSpent:       q.timeSpent        || 0,
                        userAnswer:      q.userAnswer       || [],
                        status:          q.isVisited
                            ? (q.userAnswer?.length > 0 ? 'answered' : 'visited')
                            : 'notAnswered',
                        isVisited:       q.isVisited         || false,
                        markedForReview: q.markedForReview   || false,
                        isCorrect:       isCorrect,
                        marksObtained:   q.marks             || 0,
                        isAnalyzed:      true,
                        updated_at:      new Date(),
                    },
                });
            }));

        }, { maxWait: 10000, timeout: 30000 });

        console.log(`✅ finalSubmitTest complete — ${finalVerdict.length} questions saved for test ${testId}`);
        return true;

    } catch (err) {
        console.error("❌ finalSubmitTest failed:", err);
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
                    updated_at: { lt: cutoffTime }
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