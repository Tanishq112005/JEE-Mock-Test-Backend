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
            // Fetch question data without JSON columns to avoid TiDB adapter crash
            const questionData = await this.db.questions.findUnique({
                where: { id: input.questionId },
                select: {
                    id: true,
                    type: true,
                    positiveMarks: true,
                    negativeMarks: true,
                    subjectId: true,
                    chapterId: true,
                    subjects: true,
                    chapters: true,
                    papers: {
                        include: {
                            exam: true,
                        },
                    },
                },
            });
            if (!questionData)
                throw new Error(`Question not found: ${input.questionId}`);
            // Fetch correctAnswer using a raw query to bypass Prisma JSON serialization bug
            const rawAns = await this.db.$queryRawUnsafe(`SELECT CAST(correctAnswer AS CHAR) as correctAnswer FROM questions WHERE id = '${input.questionId}'`);
            let parsedCorrectAnswer = [];
            if (rawAns && rawAns.length > 0 && rawAns[0].correctAnswer) {
                try {
                    parsedCorrectAnswer = JSON.parse(rawAns[0].correctAnswer);
                }
                catch (e) {
                    console.error("Error parsing correctAnswer:", e);
                }
            }
            const evaluator = new answerVerifyService_1.AnswerVerifyService();
            const correctAnswer = this.toStringArray(parsedCorrectAnswer);
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
