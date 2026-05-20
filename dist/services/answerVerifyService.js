"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerVerifyService = void 0;
class AnswerVerifyService {
    constructor() { }
    questionResult(rawUserAnswer, rawCorrectAnswer, questionType, positiveMarks, negativeMarks) {
        const userAnswer = Array.from(new Set((rawUserAnswer || []).map((a) => a.trim()).filter((a) => a !== "")));
        const correctAnswer = Array.from(new Set((rawCorrectAnswer || []).map((a) => a.trim()).filter((a) => a !== "")));
        if (userAnswer.length === 0) {
            return {
                marks: 0,
                verdict: "unattempted",
            };
        }
        const isExactMatch = userAnswer.length === correctAnswer.length &&
            [...userAnswer].sort().join(",") === [...correctAnswer].sort().join(",");
        const isPartialAllowed = questionType === "MultiCorrect" ||
            questionType === "ComprehensionMultiCorrect";
        if (isPartialAllowed) {
            if (isExactMatch) {
                return {
                    marks: positiveMarks,
                    verdict: "correct",
                };
            }
            const correctAnswersSet = new Set(correctAnswer);
            let count = 0;
            for (let i = 0; i < userAnswer.length; i++) {
                if (correctAnswersSet.has(userAnswer[i])) {
                    count++;
                }
                else {
                    return {
                        marks: -Math.abs(negativeMarks),
                        verdict: "wrong",
                    };
                }
            }
            return {
                marks: count,
                verdict: "partial",
            };
        }
        else {
            if (isExactMatch) {
                return {
                    marks: positiveMarks,
                    verdict: "correct",
                };
            }
            else {
                return {
                    marks: -Math.abs(negativeMarks),
                    verdict: "wrong",
                };
            }
        }
    }
}
exports.AnswerVerifyService = AnswerVerifyService;
