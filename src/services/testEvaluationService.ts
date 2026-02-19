import { PrismaClient } from "@prisma/client";
import { question } from "../repositories/question.db";
import { questionUpdateDetails, updatingDetails } from "../types/testStatus.types";
import { paper } from "../repositories/paper.db";
import { AnswerVerifyService } from "./answerVerifyService";
import { questionBitmapRegistry } from "./uniqueCountService";

interface QuestionTypeStat {
    totalQuestions: number;
    attempt:        number;
    correct:        number;
    partial:        number;
    wrong:          number;
    positiveMarks:  number;
    partialMarks:   number;
    negativeMarks:  number;
    marks:          number;
    timeTaken:      number;
    accuracy:       number;
}

// ✅ NEW — chapter stat shape
interface ChapterStat {
    chapterId:      string;
    chapterName:    string;
    subjectName:    string;
    totalQuestions: number;
    attempt:        number;
    correct:        number;
    partial:        number;
    wrong:          number;
    positiveMarks:  number;
    partialMarks:   number;
    negativeMarks:  number;
    marks:          number;
    timeTaken:      number;
    accuracy:       number;
}

class TestEvalution {
    constructor() {}

    async evaluation(lastStatus: updatingDetails, studentId: string) {
        try {
            const gettingAllQuestionsOfPaper = await question.gettingQuestionsInformation(lastStatus.paperId);
            const paperMarkingScheme = await paper.paperMarkingScheme(lastStatus.paperId);
            let updateQuestion = new Map();

            if (!gettingAllQuestionsOfPaper || gettingAllQuestionsOfPaper.length === 0) return;

            const getEmptyQuestionTypeStat = (): QuestionTypeStat => ({
                totalQuestions: 0, attempt: 0, correct: 0, partial: 0, wrong: 0,
                positiveMarks: 0, partialMarks: 0, negativeMarks: 0, marks: 0,
                timeTaken: 0, accuracy: 0,
            });

            const questionTypeStats: Record<string, QuestionTypeStat> = {
                SingleCorrect:              getEmptyQuestionTypeStat(),
                MultiCorrect:               getEmptyQuestionTypeStat(),
                Integer:                    getEmptyQuestionTypeStat(),
                ComprehensionSingleCorrect: getEmptyQuestionTypeStat(),
                ComprehensionMultiCorrect:  getEmptyQuestionTypeStat(),
                ComprehensionInteger:       getEmptyQuestionTypeStat(),
            };

            // ✅ Chapter stats map — keyed by chapterId
            const chapterStats: Map<string, ChapterStat> = new Map();

            let mathTotalQuestions      = 0;
            let physicsTotalQuestions   = 0;
            let chemistryTotalQuestions = 0;

            for (let i = 0; i < gettingAllQuestionsOfPaper.length; i++) {
                const q = gettingAllQuestionsOfPaper[i];

                // Subject counts
                if (q.subjects.name === "Mathematics")  mathTotalQuestions++;
                else if (q.subjects.name === "Physics")  physicsTotalQuestions++;
                else if (q.subjects.name === "Chemistry") chemistryTotalQuestions++;

                // Question type counts
                if (questionTypeStats[q.type]) {
                    questionTypeStats[q.type].totalQuestions++;
                }

                // ✅ Initialize chapter stat if not already present
                if (q.chapters) {
                    if (!chapterStats.has(q.chapters.id)) {
                        chapterStats.set(q.chapters.id, {
                            chapterId:      q.chapters.id,
                            chapterName:    q.chapters.name,
                            subjectName:    q.subjects.name,
                            totalQuestions: 0,
                            attempt:        0,
                            correct:        0,
                            partial:        0,
                            wrong:          0,
                            positiveMarks:  0,
                            partialMarks:   0,
                            negativeMarks:  0,
                            marks:          0,
                            timeTaken:      0,
                            accuracy:       0,
                        });
                    }
                    // ✅ Count total questions per chapter
                    chapterStats.get(q.chapters.id)!.totalQuestions++;
                }

                updateQuestion.set(q.id, {
                    userAnswer:     [],
                    isVisited:      false,
                    timeSpent:      0,
                    markedForReview: false,
                });
            }

            const questionDetails: questionUpdateDetails[] = lastStatus.questionStatus;
            for (let i = 0; i < questionDetails.length; i++) {
                updateQuestion.set(questionDetails[i].questionId, questionDetails[i]);
            }

            let finalVerdict = [];
            const evalutionAnswer = new AnswerVerifyService(paperMarkingScheme);

            for (let i = 0; i < gettingAllQuestionsOfPaper.length; i++) {
                const questionData    = gettingAllQuestionsOfPaper[i];
                const questionDetails: questionUpdateDetails = updateQuestion.get(questionData.id);

                const result = evalutionAnswer.questionResult(
                    questionDetails.userAnswer,
                    questionData.correctAnswer,
                    questionData.type,
                );

                finalVerdict.push({
                    questionId:         questionData.id,
                    type:               questionData.type,
                    isVisited:          questionDetails.isVisited,
                    timeSpent:          questionDetails.timeSpent,
                    markedForReview:    questionDetails.markedForReview,
                    userAnswer:         questionDetails.userAnswer,
                    verdict:            result.verdict,
                    marks:              result.marks,
                    totalPositiveMarks: questionData.positiveMarks,
                    totalNegativeMarks: questionData.negativeMarks,
                    subject:            questionData.subjects.name,
                    chapterId:          questionData.chapters?.id   ?? null,  // ✅
                    chapterName:        questionData.chapters?.name ?? null,  // ✅
                });
            }

            let mathattemptCount = 0, physicsattemptCount = 0, chemistryattemptCount = 0;
            let mathCorrectPositiveMarks = 0, mathNegativeMarks = 0;
            let physicsCorrectPositiveMarks = 0, physiscsNegativeMarks = 0;
            let chemistryCorrectPostiveMarks = 0, chemistryNegativeMarks = 0;
            let mathPartialPositiveMarks = 0, physicsPartialPositiveMarks = 0, chemistryPartialPositiveMarks = 0;
            let mathCorrect = 0, mathPartial = 0, mathWrong = 0;
            let physicsCorrect = 0, physicsPartial = 0, physicsWrong = 0;
            let chemistryCorrect = 0, chemistryPartial = 0, chemistryWrong = 0;
            let mathTimeTaken = 0, physicsTimeTaken = 0, chemistryTimeTaken = 0;
            let totalTimeTaken = 0;

            for (let i = 0; i < finalVerdict.length; i++) {
                const q = finalVerdict[i];
                totalTimeTaken += q.timeSpent;

                // Subject time
                if (q.subject === "Mathematics")       mathTimeTaken      += q.timeSpent;
                else if (q.subject === "Physics")      physicsTimeTaken   += q.timeSpent;
                else if (q.subject === "Chemistry")    chemistryTimeTaken += q.timeSpent;

                // Question type time
                const qtStat = questionTypeStats[q.type];
                if (qtStat) qtStat.timeTaken += q.timeSpent;

                // ✅ Chapter time tracking
                if (q.chapterId && chapterStats.has(q.chapterId)) {
                    chapterStats.get(q.chapterId)!.timeTaken += q.timeSpent;
                }

                if (q.isVisited) {
                    // ── Question type tracking ──
                    if (qtStat) {
                        qtStat.attempt++;
                        if (q.verdict === "correct") {
                            qtStat.correct++;
                            qtStat.positiveMarks += q.marks;
                        } else if (q.verdict === "partial") {
                            qtStat.partial++;
                            qtStat.partialMarks += q.marks;
                        } else if (q.verdict === "wrong") {
                            qtStat.wrong++;
                            qtStat.negativeMarks += Math.abs(q.marks);
                        }
                        qtStat.marks = qtStat.positiveMarks + qtStat.partialMarks - qtStat.negativeMarks;
                    }

                    // ✅ Chapter tracking
                    if (q.chapterId && chapterStats.has(q.chapterId)) {
                        const ch = chapterStats.get(q.chapterId)!;
                        ch.attempt++;
                        if (q.verdict === "correct") {
                            ch.correct++;
                            ch.positiveMarks += q.marks;
                        } else if (q.verdict === "partial") {
                            ch.partial++;
                            ch.partialMarks += q.marks;
                        } else if (q.verdict === "wrong") {
                            ch.wrong++;
                            ch.negativeMarks += Math.abs(q.marks);
                        }
                        ch.marks    = ch.positiveMarks + ch.partialMarks - ch.negativeMarks;
                        ch.accuracy = ch.attempt > 0
                            ? ((ch.correct + ch.partial) / ch.attempt) * 100
                            : 0;
                    }

                    // ── Subject tracking ──
                    if (q.subject === "Mathematics") {
                        mathattemptCount++;
                        if (q.verdict === "correct") {
                            await questionBitmapRegistry.markAttempted(studentId, q.questionId);
                            mathCorrectPositiveMarks += q.marks;
                            mathCorrect++;
                        } else if (q.verdict === "partial") {
                            mathPartialPositiveMarks += q.marks;
                            mathPartial++;
                        } else if (q.verdict === "wrong") {
                            mathNegativeMarks += Math.abs(q.marks);
                            mathWrong++;
                        }
                    } else if (q.subject === "Physics") {
                        physicsattemptCount++;
                        if (q.verdict === "correct") {
                            await questionBitmapRegistry.markAttempted(studentId, q.questionId);
                            physicsCorrectPositiveMarks += q.marks;
                            physicsCorrect++;
                        } else if (q.verdict === "partial") {
                            physicsPartialPositiveMarks += q.marks;
                            physicsPartial++;
                        } else if (q.verdict === "wrong") {
                            physiscsNegativeMarks += Math.abs(q.marks);
                            physicsWrong++;
                        }
                    } else if (q.subject === "Chemistry") {
                        chemistryattemptCount++;
                        if (q.verdict === "correct") {
                            await questionBitmapRegistry.markAttempted(studentId, q.questionId);
                            chemistryCorrectPostiveMarks += q.marks;
                            chemistryCorrect++;
                        } else if (q.verdict === "partial") {
                            chemistryPartialPositiveMarks += q.marks;
                            chemistryPartial++;
                        } else if (q.verdict === "wrong") {
                            chemistryNegativeMarks += Math.abs(q.marks);
                            chemistryWrong++;
                        }
                    }
                }
            }

            // Accuracies for question types
            Object.keys(questionTypeStats).forEach((key) => {
                const stat  = questionTypeStats[key];
                stat.accuracy = stat.attempt > 0
                    ? ((stat.correct + stat.partial) / stat.attempt) * 100
                    : 0;
            });

            const totalAttempted = mathattemptCount + physicsattemptCount + chemistryattemptCount;
            const totalCorrect   = mathCorrect + physicsCorrect + chemistryCorrect;
            const totalPartial   = mathPartial + physicsPartial + chemistryPartial;
            const overallAccuracy = totalAttempted > 0
                ? ((totalCorrect + totalPartial) / totalAttempted) * 100
                : 0;

            const summaryReport = {
                exam: gettingAllQuestionsOfPaper[0].papers?.exam.name,

                math: {
                    totalQuestions: mathTotalQuestions,
                    attempt:        mathattemptCount,
                    marks:          mathCorrectPositiveMarks + mathPartialPositiveMarks - mathNegativeMarks,
                    timeTaken:      mathTimeTaken,
                    positiveMarks:  mathCorrectPositiveMarks,
                    paritalMarks:   mathPartialPositiveMarks,
                    negativeMarks:  mathNegativeMarks,
                    correct:        mathCorrect,
                    partial:        mathPartial,
                    wrong:          mathWrong,
                    accuracy:       mathattemptCount > 0
                        ? ((mathCorrect + mathPartial) / mathattemptCount) * 100 : 0,
                },
                physics: {
                    totalQuestions: physicsTotalQuestions,
                    attempt:        physicsattemptCount,
                    marks:          physicsCorrectPositiveMarks + physicsPartialPositiveMarks - physiscsNegativeMarks,
                    timeTaken:      physicsTimeTaken,
                    positiveMarks:  physicsCorrectPositiveMarks,
                    paritalMarks:   physicsPartialPositiveMarks,
                    negativeMarks:  physiscsNegativeMarks,
                    correct:        physicsCorrect,
                    partial:        physicsPartial,
                    wrong:          physicsWrong,
                    accuracy:       physicsattemptCount > 0
                        ? ((physicsCorrect + physicsPartial) / physicsattemptCount) * 100 : 0,
                },
                chemistry: {
                    totalQuestions: chemistryTotalQuestions,
                    attempt:        chemistryattemptCount,
                    marks:          chemistryCorrectPostiveMarks + chemistryPartialPositiveMarks - chemistryNegativeMarks,
                    timeTaken:      chemistryTimeTaken,
                    positiveMarks:  chemistryCorrectPostiveMarks,
                    paritalMarks:   chemistryPartialPositiveMarks,
                    negativeMarks:  chemistryNegativeMarks,
                    correct:        chemistryCorrect,
                    partial:        chemistryPartial,
                    wrong:          chemistryWrong,
                    accuracy:       chemistryattemptCount > 0
                        ? ((chemistryCorrect + chemistryPartial) / chemistryattemptCount) * 100 : 0,
                },
                overall: {
                    totalQuestions:          mathTotalQuestions + physicsTotalQuestions + chemistryTotalQuestions,
                    totalAttempted,
                    totalCorrect,
                    totalPartial,
                    overallAccuracy,
                    totalTimeTaken,
                    averageTimePerQuestion:  totalAttempted > 0 ? totalTimeTaken / totalAttempted : 0,
                },
                questionTypes: questionTypeStats,

                // ✅ Chapter wise breakdown — array sorted by subject
                chapterWise: Array.from(chapterStats.values()).sort((a, b) =>
                    a.subjectName.localeCompare(b.subjectName)
                ),

                finalVerdict,
            };

            return summaryReport;

        } catch (err: any) {
            console.error(err);
        }
    }
}

export const testEvaluation = new TestEvalution();