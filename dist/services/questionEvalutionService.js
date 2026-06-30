"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.practiceQuestionEvaluation = void 0;
const database_1 = require("../lib/database");
const answerVerifyService_1 = require("./answerVerifyService");
// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────
class PracticeQuestionEvaluationService {
    db;
    constructor(db) {
        this.db = db;
    }
    toStringArray(value) {
        if (!Array.isArray(value))
            return [];
        return value.filter((item) => typeof item === "string");
    }
    // ══════════════════════════════════════════
    // SINGLE question evaluation
    // ══════════════════════════════════════════
    async evaluate(input) {
        try {
            let questionData = null;
            let retries = 3;
            let lastError = null;
            while (retries > 0 && !questionData) {
                try {
                    questionData = await this.db.questions.findUnique({
                        where: { id: input.questionId },
                        include: {
                            subjects: true,
                            chapters: true,
                            papers: {
                                include: {
                                    exam: true,
                                },
                            },
                        },
                    });
                    break; // Success
                }
                catch (error) {
                    lastError = error;
                    retries--;
                    if (retries === 0)
                        break;
                    // Wait briefly before retrying
                    await new Promise(res => setTimeout(res, 500));
                }
            }
            if (!questionData && lastError) {
                throw new Error(`Failed to fetch question after retries. Last error: ${lastError.message}`);
            }
            if (!questionData)
                throw new Error(`Question not found: ${input.questionId}`);
            const evaluator = new answerVerifyService_1.AnswerVerifyService();
            const correctAnswer = this.toStringArray(questionData.correctAnswer);
            const { verdict: rawVerdict, marks } = evaluator.questionResult(input.userAnswer, correctAnswer, questionData.type, questionData.positiveMarks, questionData.negativeMarks);
            const verdict = rawVerdict;
            return {
                questionId: questionData.id,
                verdict,
                marks,
                positiveMarks: questionData.positiveMarks,
                negativeMarks: questionData.negativeMarks,
                correctAnswer,
                userAnswer: input.userAnswer,
                timeSpent: input.timeSpent,
                type: questionData.type,
                subject: questionData.subjects.name,
                subjectId: questionData.subjectId,
                chapterId: questionData.chapterId ?? null,
                chapterName: questionData.chapters?.name ?? null,
                examName: questionData.papers?.exam.name ?? null,
                created_at: input.created_at
            };
        }
        catch (err) {
            throw err;
        }
    }
}
exports.practiceQuestionEvaluation = new PracticeQuestionEvaluationService(database_1.database);
