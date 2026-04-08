"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerVerifyService = void 0;
class AnswerVerifyService {
    paperMarkingScheme;
    constructor(paperMarkingScheme) {
        this.paperMarkingScheme = paperMarkingScheme;
    }
    questionResult(rawUserAnswer, rawCorrectAnswer, questionType) {
        const userAnswer = Array.from(new Set((rawUserAnswer || []).map((a) => a.trim()).filter((a) => a !== "")));
        const correctAnswer = Array.from(new Set((rawCorrectAnswer || []).map((a) => a.trim()).filter((a) => a !== "")));
        let scheme = this.paperMarkingScheme.find((s) => s.questionType === questionType);
        if (!scheme) {
            scheme = {
                isPartial: false,
                positiveMarks: 4,
                negativeMarks: 1,
                questionType: questionType,
            };
        }
        if (userAnswer.length === 0) {
            return {
                marks: 0,
                verdict: "unattempted",
            };
        }
        const isExactMatch = userAnswer.length === correctAnswer.length &&
            [...userAnswer].sort().join(",") === [...correctAnswer].sort().join(",");
        if (scheme.isPartial &&
            (questionType === "MultiCorrect" ||
                questionType === "ComprehensionMultiCorrect")) {
            if (isExactMatch) {
                return {
                    marks: scheme.positiveMarks,
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
                        marks: -Math.abs(scheme.negativeMarks),
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
                    marks: scheme.positiveMarks,
                    verdict: "correct",
                };
            }
            else {
                return {
                    marks: -Math.abs(scheme.negativeMarks),
                    verdict: "wrong",
                };
            }
        }
    }
}
exports.AnswerVerifyService = AnswerVerifyService;
