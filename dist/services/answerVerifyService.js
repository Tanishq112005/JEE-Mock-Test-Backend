"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerVerifyService = void 0;
class AnswerVerifyService {
    constructor() { }
    toStringArray(value) {
        if (!Array.isArray(value))
            return [];
        return value.filter((item) => typeof item === "string");
    }
    questionResult(rawUserAnswer, rawCorrectAnswer, questionType, positiveMarks, negativeMarks) {
        const userAnswer = Array.from(new Set(this.toStringArray(rawUserAnswer).map((a) => a.trim()).filter((a) => a !== "")));
        const correctAnswer = Array.from(new Set(this.toStringArray(rawCorrectAnswer).map((a) => a.trim()).filter((a) => a !== "")));
        if (userAnswer.length === 0) {
            return {
                marks: 0,
                verdict: "unattempted",
            };
        }
        const isNumericalType = questionType === "Integer" || questionType === "ComprehensionInteger";
        let isExactMatch = false;
        if (isNumericalType) {
            if (userAnswer.length === 1 && correctAnswer.length > 0) {
                const parsedUser = parseFloat(userAnswer[0]);
                isExactMatch = correctAnswer.some(ca => parseFloat(ca) === parsedUser);
            }
        }
        else {
            isExactMatch =
                userAnswer.length === correctAnswer.length &&
                    [...userAnswer].sort().join(",") === [...correctAnswer].sort().join(",");
        }
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
