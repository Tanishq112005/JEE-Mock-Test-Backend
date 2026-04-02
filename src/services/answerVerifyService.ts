import { paperMarkingScheme, questionType } from "@prisma/client";

export class AnswerVerifyService {
    private paperMarkingScheme: paperMarkingScheme[];

    constructor(paperMarkingScheme: paperMarkingScheme[]) {
        this.paperMarkingScheme = paperMarkingScheme;
    }

    questionResult(userAnswer: string[], correctAnswer: string[], questionType: questionType): { marks: number, verdict: string } {
        // 1. Fallback marking scheme
        let questionMarkingScheme: paperMarkingScheme = {
            isPartial: false,
            positiveMarks: 4,
            negativeMarks: 1, // Usually -1 for JEE, make sure this matches your DB
            id: 'efe7370b-f81e-43bd-9eec-7fb225c099eb',
            paperId: 'ae71c552-6b6c-455a-9fa1-a637fa36cae0',
            questionType: "Integer" as questionType
        };

        // 2. Find the correct marking scheme for this question type
        for (let i = 0; i < this.paperMarkingScheme.length; i++) {
            if (this.paperMarkingScheme[i].questionType === questionType) {
                questionMarkingScheme = this.paperMarkingScheme[i];
                break;
            }
        }

        // 3. Handle unattempted question
        if (!userAnswer || userAnswer.length === 0) {
            return {
                marks: 0,
                verdict: "unattempted"
            };
        }

        // 4. THE FIX: Helper to check if both arrays contain exactly the same elements (ignoring order)
        // Checks length first, then sorts and converts to string for a safe value-based comparison.
        const isExactMatch = 
            userAnswer.length > 0 && 
            userAnswer.length === correctAnswer.length &&
            [...userAnswer].sort().join(',') === [...correctAnswer].sort().join(',');

        // 4. Handle Partial Marking (MultiCorrect)
        if (questionMarkingScheme.isPartial && (questionType === "MultiCorrect" || questionType === "ComprehensionMultiCorrect")) {
            
            // Full marks if perfectly matched
            if (isExactMatch) {
                return {
                    marks: questionMarkingScheme.positiveMarks,
                    verdict: "correct"
                };
            }

            // Optimization: Use a Set for instant lookups instead of a nested loop
            const correctAnswersSet = new Set(correctAnswer);
            let count: number = 0;

            for (let i = 0; i < userAnswer.length; i++) {
                // If the user's selected option is in the correct answers set
                if (correctAnswersSet.has(userAnswer[i])) {
                    count++;
                } else {
                    // If they selected even one wrong option, the whole answer is penalized
                    return {
                        marks: questionMarkingScheme.negativeMarks,
                        verdict: "wrong"
                    };
                }
            }

            // If we reach here, they selected some correct options and NO wrong options
            return {
                marks: count, // Standard JEE: +1 for each correct option selected
                verdict: "partial"
            };
        } 
        
        // 5. Handle Standard Single Correct / Integer Marking
        else {
            if (isExactMatch) {
                return {
                    marks: questionMarkingScheme.positiveMarks,
                    verdict: "correct"
                };
            } else {
                return {
                    marks: questionMarkingScheme.negativeMarks,
                    verdict: "wrong"
                };
            }
        }
    }
}