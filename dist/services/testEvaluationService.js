"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEvaluation = void 0;
const question_db_1 = require("../repositories/question.db");
const answerVerifyService_1 = require("./answerVerifyService");
const uniqueCountService_1 = require("./uniqueCountService");
class TestEvaluation {
    constructor() { }
    // Helper for precision
    formatFloat(num) {
        return parseFloat(num.toFixed(4));
    }
    async evaluation(lastStatus, studentId) {
        try {
            const gettingAllQuestionsOfPaper = await question_db_1.question.gettingQuestionsInformation(lastStatus.paperId);
            let updateQuestion = new Map();
            if (!gettingAllQuestionsOfPaper ||
                gettingAllQuestionsOfPaper.length === 0) {
                throw new Error(`No questions found for paperId: ${lastStatus.paperId}. Cannot evaluate test.`);
            }
            const getEmptyQuestionTypeStat = () => ({
                totalQuestions: 0,
                attempt: 0,
                correct: 0,
                partial: 0,
                wrong: 0,
                positiveMarks: 0,
                maxMarks: 0,
                partialMarks: 0,
                negativeMarks: 0,
                marks: 0,
                timeTaken: 0,
                accuracy: 0,
            });
            const questionTypeStats = {
                SingleCorrect: getEmptyQuestionTypeStat(),
                MultiCorrect: getEmptyQuestionTypeStat(),
                Integer: getEmptyQuestionTypeStat(),
                ComprehensionSingleCorrect: getEmptyQuestionTypeStat(),
                ComprehensionMultiCorrect: getEmptyQuestionTypeStat(),
                ComprehensionInteger: getEmptyQuestionTypeStat(),
            };
            const chapterStats = new Map();
            let mathTotalQuestions = 0;
            let physicsTotalQuestions = 0;
            let chemistryTotalQuestions = 0;
            let mathMaxMarks = 0;
            let physicsMaxMarks = 0;
            let chemistryMaxMarks = 0;
            for (let i = 0; i < gettingAllQuestionsOfPaper.length; i++) {
                const q = gettingAllQuestionsOfPaper[i];
                if (q.subjects.name === "Mathematics") {
                    mathTotalQuestions++;
                    mathMaxMarks += q.positiveMarks ?? 4;
                }
                else if (q.subjects.name === "Physics") {
                    physicsTotalQuestions++;
                    physicsMaxMarks += q.positiveMarks ?? 4;
                }
                else if (q.subjects.name === "Chemistry") {
                    chemistryTotalQuestions++;
                    chemistryMaxMarks += q.positiveMarks ?? 4;
                }
                if (questionTypeStats[q.type]) {
                    questionTypeStats[q.type].totalQuestions++;
                }
                if (q.chapters) {
                    if (!chapterStats.has(q.chapters.id)) {
                        chapterStats.set(q.chapters.id, {
                            chapterId: q.chapters.id,
                            chapterName: q.chapters.name,
                            subjectName: q.subjects.name,
                            totalQuestions: 0,
                            attempt: 0,
                            correct: 0,
                            partial: 0,
                            wrong: 0,
                            positiveMarks: 0,
                            maxMarks: 0,
                            partialMarks: 0,
                            negativeMarks: 0,
                            marks: 0,
                            timeTaken: 0,
                            accuracy: 0,
                        });
                    }
                    chapterStats.get(q.chapters.id).totalQuestions++;
                }
                updateQuestion.set(q.id, {
                    questionId: q.id,
                    userAnswer: [],
                    isVisited: false,
                    timeSpent: 0,
                    markedForReview: false,
                });
            }
            const questionDetails = lastStatus.questionStatus || [];
            for (let i = 0; i < questionDetails.length; i++) {
                updateQuestion.set(questionDetails[i].questionId, questionDetails[i]);
            }
            let finalVerdict = [];
            const evalutionAnswer = new answerVerifyService_1.AnswerVerifyService();
            for (let i = 0; i < gettingAllQuestionsOfPaper.length; i++) {
                const questionData = gettingAllQuestionsOfPaper[i];
                const questionDetail = updateQuestion.get(questionData.id);
                const result = evalutionAnswer.questionResult(questionDetail.userAnswer, questionData.correctAnswer, questionData.type, questionData.positiveMarks, questionData.negativeMarks);
                finalVerdict.push({
                    questionId: questionData.id,
                    type: questionData.type,
                    isVisited: questionDetail.isVisited,
                    timeSpent: questionDetail.timeSpent,
                    markedForReview: questionDetail.markedForReview,
                    userAnswer: questionDetail.userAnswer,
                    verdict: result.verdict,
                    marks: result.marks,
                    totalPositiveMarks: questionData.positiveMarks,
                    totalNegativeMarks: questionData.negativeMarks,
                    subject: questionData.subjects.name,
                    chapterId: questionData.chapters?.id ?? null,
                    chapterName: questionData.chapters?.name ?? null,
                });
            }
            let mathattemptCount = 0, physicsattemptCount = 0, chemistryattemptCount = 0;
            let mathCorrectPositiveMarks = 0, mathNegativeMarks = 0;
            let physicsCorrectPositiveMarks = 0, physicsNegativeMarks = 0;
            let chemistryCorrectPositiveMarks = 0, chemistryNegativeMarks = 0;
            let mathPartialPositiveMarks = 0, physicsPartialPositiveMarks = 0, chemistryPartialPositiveMarks = 0;
            let mathCorrect = 0, mathPartial = 0, mathWrong = 0;
            let physicsCorrect = 0, physicsPartial = 0, physicsWrong = 0;
            let chemistryCorrect = 0, chemistryPartial = 0, chemistryWrong = 0;
            let mathTimeTaken = 0, physicsTimeTaken = 0, chemistryTimeTaken = 0;
            let totalTimeTaken = 0;
            // Array to hold questions that need to be marked in DB
            const correctQuestionIdsForRegistry = [];
            for (let i = 0; i < finalVerdict.length; i++) {
                const q = finalVerdict[i];
                totalTimeTaken += q.timeSpent;
                if (q.subject === "Mathematics")
                    mathTimeTaken += q.timeSpent;
                else if (q.subject === "Physics")
                    physicsTimeTaken += q.timeSpent;
                else if (q.subject === "Chemistry")
                    chemistryTimeTaken += q.timeSpent;
                const qtStat = questionTypeStats[q.type];
                if (qtStat) {
                    qtStat.timeTaken += q.timeSpent;
                    qtStat.maxMarks += q.totalPositiveMarks;
                }
                if (q.chapterId && chapterStats.has(q.chapterId)) {
                    const ch = chapterStats.get(q.chapterId);
                    ch.timeTaken += q.timeSpent;
                    ch.maxMarks += q.totalPositiveMarks;
                }
                // FIX: Check if question was ACTUALLY attempted (not just visited)
                const isAttempted = q.verdict === "correct" ||
                    q.verdict === "partial" ||
                    q.verdict === "wrong";
                if (isAttempted) {
                    // ── Question type tracking ──
                    if (qtStat) {
                        qtStat.attempt++;
                        if (q.verdict === "correct") {
                            qtStat.correct++;
                            qtStat.positiveMarks += q.marks;
                        }
                        else if (q.verdict === "partial") {
                            qtStat.partial++;
                            qtStat.partialMarks += q.marks;
                        }
                        else if (q.verdict === "wrong") {
                            qtStat.wrong++;
                            qtStat.negativeMarks += Math.abs(q.totalNegativeMarks || 0);
                        }
                        qtStat.marks =
                            qtStat.positiveMarks + qtStat.partialMarks - qtStat.negativeMarks;
                        qtStat.accuracy =
                            qtStat.attempt > 0
                                ? this.formatFloat((qtStat.correct / qtStat.attempt) * 100)
                                : 0;
                    }
                    // ── Chapter tracking ──
                    if (q.chapterId && chapterStats.has(q.chapterId)) {
                        const ch = chapterStats.get(q.chapterId);
                        ch.attempt++;
                        if (q.verdict === "correct") {
                            ch.correct++;
                            ch.positiveMarks += q.marks;
                        }
                        else if (q.verdict === "partial") {
                            ch.partial++;
                            ch.partialMarks += q.marks;
                        }
                        else if (q.verdict === "wrong") {
                            ch.wrong++;
                            ch.negativeMarks += Math.abs(q.totalNegativeMarks || 0);
                        }
                        ch.marks = ch.positiveMarks + ch.partialMarks - ch.negativeMarks;
                        ch.accuracy =
                            ch.attempt > 0
                                ? this.formatFloat((ch.correct / ch.attempt) * 100)
                                : 0;
                    }
                    // ── Subject tracking ──
                    if (q.subject === "Mathematics") {
                        mathattemptCount++;
                        if (q.verdict === "correct") {
                            correctQuestionIdsForRegistry.push(q.questionId);
                            mathCorrectPositiveMarks += q.marks;
                            mathCorrect++;
                        }
                        else if (q.verdict === "partial") {
                            mathPartialPositiveMarks += q.marks;
                            mathPartial++;
                        }
                        else if (q.verdict === "wrong") {
                            mathNegativeMarks += Math.abs(q.totalNegativeMarks || 0);
                            mathWrong++;
                        }
                    }
                    else if (q.subject === "Physics") {
                        physicsattemptCount++;
                        if (q.verdict === "correct") {
                            correctQuestionIdsForRegistry.push(q.questionId);
                            physicsCorrectPositiveMarks += q.marks;
                            physicsCorrect++;
                        }
                        else if (q.verdict === "partial") {
                            physicsPartialPositiveMarks += q.marks;
                            physicsPartial++;
                        }
                        else if (q.verdict === "wrong") {
                            physicsNegativeMarks += Math.abs(q.totalNegativeMarks || 0);
                            physicsWrong++;
                        }
                    }
                    else if (q.subject === "Chemistry") {
                        chemistryattemptCount++;
                        if (q.verdict === "correct") {
                            correctQuestionIdsForRegistry.push(q.questionId);
                            chemistryCorrectPositiveMarks += q.marks;
                            chemistryCorrect++;
                        }
                        else if (q.verdict === "partial") {
                            chemistryPartialPositiveMarks += q.marks;
                            chemistryPartial++;
                        }
                        else if (q.verdict === "wrong") {
                            chemistryNegativeMarks += Math.abs(q.totalNegativeMarks || 0);
                            chemistryWrong++;
                        }
                    }
                }
            }
            // --- PERFORMANCE FIX: Execute DB calls efficiently outside the loop ---
            if (correctQuestionIdsForRegistry.length > 0) {
                // Run them all concurrently as a batch
                await uniqueCountService_1.questionBitmapRegistry.markAttemptedBatch(studentId, correctQuestionIdsForRegistry);
            }
            // Streak update is now handled asynchronously by streakCacheService
            // when questionBitmapRegistry.markAttemptedBatch is called.
            // ----------------------------------------------------------------------
            // Accuracies for question types
            Object.keys(questionTypeStats).forEach((key) => {
                const stat = questionTypeStats[key];
                stat.accuracy =
                    stat.attempt > 0
                        ? this.formatFloat(((stat.correct + stat.partial) / stat.attempt) * 100)
                        : 0;
            });
            const totalAttempted = mathattemptCount + physicsattemptCount + chemistryattemptCount;
            const totalCorrect = mathCorrect + physicsCorrect + chemistryCorrect;
            const totalPartial = mathPartial + physicsPartial + chemistryPartial;
            const overallAccuracy = totalAttempted > 0
                ? this.formatFloat(((totalCorrect + totalPartial) / totalAttempted) * 100)
                : 0;
            const summaryReport = {
                paperId: lastStatus.paperId,
                exam: gettingAllQuestionsOfPaper[0].papers?.exam.name,
                math: {
                    totalQuestions: mathTotalQuestions,
                    attempt: mathattemptCount,
                    marks: mathCorrectPositiveMarks +
                        mathPartialPositiveMarks -
                        mathNegativeMarks,
                    timeTaken: mathTimeTaken,
                    positiveMarks: mathCorrectPositiveMarks,
                    maxMarks: mathMaxMarks,
                    partialMarks: mathPartialPositiveMarks,
                    negativeMarks: mathNegativeMarks,
                    correct: mathCorrect,
                    partial: mathPartial,
                    wrong: mathWrong,
                    accuracy: mathattemptCount > 0
                        ? this.formatFloat(((mathCorrect + mathPartial) / mathattemptCount) * 100)
                        : 0,
                },
                physics: {
                    totalQuestions: physicsTotalQuestions,
                    attempt: physicsattemptCount,
                    marks: physicsCorrectPositiveMarks +
                        physicsPartialPositiveMarks -
                        physicsNegativeMarks,
                    timeTaken: physicsTimeTaken,
                    positiveMarks: physicsCorrectPositiveMarks,
                    maxMarks: physicsMaxMarks,
                    partialMarks: physicsPartialPositiveMarks,
                    negativeMarks: physicsNegativeMarks,
                    correct: physicsCorrect,
                    partial: physicsPartial,
                    wrong: physicsWrong,
                    accuracy: physicsattemptCount > 0
                        ? this.formatFloat(((physicsCorrect + physicsPartial) / physicsattemptCount) *
                            100)
                        : 0,
                },
                chemistry: {
                    totalQuestions: chemistryTotalQuestions,
                    attempt: chemistryattemptCount,
                    marks: chemistryCorrectPositiveMarks +
                        chemistryPartialPositiveMarks -
                        chemistryNegativeMarks,
                    timeTaken: chemistryTimeTaken,
                    positiveMarks: chemistryCorrectPositiveMarks,
                    maxMarks: chemistryMaxMarks,
                    partialMarks: chemistryPartialPositiveMarks,
                    negativeMarks: chemistryNegativeMarks,
                    correct: chemistryCorrect,
                    partial: chemistryPartial,
                    wrong: chemistryWrong,
                    accuracy: chemistryattemptCount > 0
                        ? this.formatFloat(((chemistryCorrect + chemistryPartial) /
                            chemistryattemptCount) *
                            100)
                        : 0,
                },
                overall: {
                    totalQuestions: mathTotalQuestions +
                        physicsTotalQuestions +
                        chemistryTotalQuestions,
                    totalAttempted,
                    totalCorrect,
                    totalPartial,
                    overallAccuracy,
                    totalTimeTaken,
                    averageTimePerQuestion: totalAttempted > 0
                        ? this.formatFloat(totalTimeTaken / totalAttempted)
                        : 0,
                    totalScore: mathCorrectPositiveMarks +
                        mathPartialPositiveMarks -
                        mathNegativeMarks +
                        physicsCorrectPositiveMarks +
                        physicsPartialPositiveMarks -
                        physicsNegativeMarks +
                        chemistryCorrectPositiveMarks +
                        chemistryPartialPositiveMarks -
                        chemistryNegativeMarks,
                    maxScore: mathMaxMarks + physicsMaxMarks + chemistryMaxMarks,
                },
                questionTypes: questionTypeStats,
                chapterWise: Array.from(chapterStats.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
                finalVerdict,
            };
            return summaryReport;
        }
        catch (err) {
            console.error("Error in test evaluation:", err);
            throw err;
        }
    }
}
exports.testEvaluation = new TestEvaluation();
