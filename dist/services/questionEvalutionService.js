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
    // ══════════════════════════════════════════
    // SINGLE question evaluation
    // ══════════════════════════════════════════
    async evaluate(input) {
        try {
            const questionData = await this.db.questions.findUnique({
                where: { id: input.questionId },
                include: {
                    subjects: true,
                    chapters: true,
                    papers: {
                        include: {
                            exam: true,
                            markingSchemes: true,
                        },
                    },
                },
            });
            if (!questionData)
                throw new Error(`Question not found: ${input.questionId}`);
            const evaluator = new answerVerifyService_1.AnswerVerifyService();
            const { verdict: rawVerdict, marks } = evaluator.questionResult(input.userAnswer, questionData.correctAnswer, questionData.type, questionData.positiveMarks, questionData.negativeMarks);
            const verdict = rawVerdict;
            return {
                questionId: questionData.id,
                verdict,
                marks,
                positiveMarks: questionData.positiveMarks,
                negativeMarks: questionData.negativeMarks,
                correctAnswer: questionData.correctAnswer,
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
