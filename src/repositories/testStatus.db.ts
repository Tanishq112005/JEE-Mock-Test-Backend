import { AttemptStatus, PartialMarkingRule, PrismaClient, questionType, TestState } from "@prisma/client";
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
                studentId : userId,
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
            where: { paperId : paperId, 
                studentId : userId },
            orderBy: { created_at: 'desc' }
        });
    }

    // =================================================================
    // 3. UPDATING TEST DETAILS
    // =================================================================
    async updatingTestDetails(updateDetails: updatingDetails) {
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
            const activeQuestions = updateDetails.questionStatus.filter((q: any) => 
                q.questionId === updateDetails.activeQuestionId || // Always update the current question
                q.isVisited === true ||                            // Update if user visited it
                q.status === 'answered' ||                         // Update if answered
                q.status === 'markedForReview'                     // Update if marked
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
                const questionPromises = activeQuestions.map((q: any) => {
                    let formattedAnswer: string[] = [];

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
                        } else {
                            formattedAnswer = [String(q.userAnswer)];
                        }
                    }

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

                await Promise.all(questionPromises);
                
                return updateParent;

            }, {
                maxWait: 5000, 
                timeout: 20000 
            });

            console.log(`✅ Success! Updated ${activeQuestions.length} questions.`);
            return result;

        } catch (err) {
            console.error("❌ Transaction Failed:", err);
            throw err;
        }
    }
    // =================================================================
    // 4. SUBMIT TEST
    // =================================================================
    async submitTest(testStatusId: string) {
        try {
            console.log(`📝 Starting Evaluation for Test: ${testStatusId}`);

            // 1. Fetch ALL necessary data to grade the test
            // We need: User Attempts, Question Correct Answers, Paper Marking Schemes
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

            if (!testContext) throw new Error("Test Session not found");

            // 2. Create a Map for Marking Schemes (Type -> Scheme) for O(1) access
            const schemeMap = new Map();
            testContext.papers.markingSchemes.forEach(scheme => {
                schemeMap.set(scheme.questionType, scheme);
            });

            // 3. Evaluate Each Question
            const evaluationUpdates = [];

            for (const attempt of testContext.testQuestionStatus) {
                // Skip if not answered
                if (attempt.status !== AttemptStatus.answered && attempt.status !== AttemptStatus.markedForReview) {
                    continue; 
                }

                const question = attempt.questions;
                const userAns = attempt.userAnswer; // Array of strings
                const correctAns = question.correctAnswer; // Array of strings

                // Get Marking Rules (Question specific overrides OR Paper defaults)
                const scheme = schemeMap.get(question.type);
              
                // Defaults
                let pos = scheme?.positiveMarks || 4;
                let neg = scheme?.negativeMarks || -1;
               
                // Overrides (if defined on the specific question)
                if (question.positiveMarks !== 0) pos = question.positiveMarks;
                if (question.negativeMarks !== 0) neg = question.negativeMarks;

                // --- CALCULATION LOGIC ---
                let marks = 0;
                let isCorrect = false;
                 const deduction = -Math.abs(neg);
                // Handle Bonus Questions (Free Marks)
                if (question.isBonus) {
                    marks = pos;
                    isCorrect = true;
                } 

                
                else {
                    // Call the Logic Helper
                    const result = this.calculateMarks(
                        question.type, 
                        userAns, 
                        correctAns, 
                        pos, 
                        deduction, 
                        scheme // Pass full scheme for partial rules
                    );
                    marks = result.marks;
                    isCorrect = result.isFullCorrect;
                }

                // Prepare DB Update
                evaluationUpdates.push(
                    this.db.testQuestionAttemptStatus.update({
                        where: { id: attempt.id },
                        data: {
                            marksObtained: marks,
                            isCorrect: isCorrect,
                            // Ensure status is finalized
                            status: AttemptStatus.answered 
                        }
                    })
                );
            }

            // 4. Transaction: Save Grades & Close Test
            await this.db.$transaction([
                ...evaluationUpdates,
                this.db.testStatus.update({
                    where: { id: testStatusId },
                    data: {
                        status: TestState.COMPLETED,
                        updated_at: new Date()
                    }
                })
            ]);

            console.log(`✅ Grading Complete. Updated ${evaluationUpdates.length} attempts.`);

            
            return { 
                message: "Test Submitted & Graded Successfully", 
                testId: testStatusId 
            };

        } catch (err) {
            console.error("Error evaluating test:", err);
            throw err;
        }
    }

    /**
     * CORE GRADING ALGORITHM
     * Handles Single, Integer, and Complex Partial Marking
     */
    private calculateMarks(
        type: questionType, 
        userAns: string[], 
        correctAns: string[], 
        pos: number, 
        neg: number,
        scheme: any
    ): { marks: number, isFullCorrect: boolean } {
        
        // A. Basic Matching (Integer, Single Choice)
        if (type === questionType.Integer || type === questionType.SingleCorrect || type === questionType.ComprehensionSingleCorrect || type === questionType.ComprehensionInteger) {
            // Sort to ensure ["A"] matches ["A"]
            const isMatch = this.arraysEqual(userAns, correctAns);
            if (isMatch) return { marks: pos, isFullCorrect: true };
            return { marks: neg, isFullCorrect: false }; // Wrong answer
        }

        // B. Multi-Correct (The Beast)
        if (type === questionType.MultiCorrect || type === questionType.ComprehensionMultiCorrect) {
            
            // 1. Check for ANY wrong option
            // If user selected even ONE option that isn't in correctAns -> Negative Marks
            const hasWrongOption = userAns.some(ans => !correctAns.includes(ans));
            if (hasWrongOption) {
                return { marks: neg, isFullCorrect: false };
            }

            // 2. Exact Match (All Correct Options Selected)
            if (userAns.length === correctAns.length) {
                return { marks: pos, isFullCorrect: true };
            }

            // 3. Partial Marking Logic
            // If we are here, user selected SOME correct options and NO wrong options.
            if (!scheme || !scheme.isPartial) {
                // If partial marking is OFF -> 0 marks (not negative, just 0 usually, or negative depending on strictness)
                // Standard JEE Main behavior for Multi: No partial -> 0 if incomplete? 
                // Let's assume 0 for incomplete if strict.
                return { marks: 0, isFullCorrect: false };
            }

            // Logic Switch based on Rule Type
            const rule = scheme.ruleType as PartialMarkingRule;

            if (rule === PartialMarkingRule.LINEAR) {
                // Old JEE Style: +1 for each correct option selected
                return { 
                    marks: userAns.length * scheme.partialMarks, // e.g., 2 options * 1 mark = +2
                    isFullCorrect: false 
                };
            }

            if (rule === PartialMarkingRule.STEP_WISE) {
                // JEE Advanced 2024 Style:
                // Correct: A, B, C, D (+4)
                // User: A, B, C (Missed 1) -> +3
                // User: A, B (Missed 2) -> +2
                // User: A (Missed 3) -> +1 (Only if allowed, usually it stops at +2)
                
                const missedCount = correctAns.length - userAns.length;
                
                if (missedCount === 1) return { marks: 3, isFullCorrect: false }; // Missed 1 option
                if (missedCount === 2) return { marks: 2, isFullCorrect: false }; // Missed 2 options
                // If missed 3 or more (e.g. only picked 1 out of 4), usually 0 or +1 depending on year.
                // Assuming +1 for now as a fallback for "some correctness"
                return { marks: 1, isFullCorrect: false };
            }

            // Fallback
            return { marks: 0, isFullCorrect: false };
        }

        return { marks: 0, isFullCorrect: false };
    }

    // Helper: Compare two arrays regardless of order
    private arraysEqual(a: string[], b: string[]) {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, index) => val === sortedB[index]);
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