"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionService = void 0;
const question_db_1 = require("../repositories/question.db");
const imageService_1 = require("./imageService");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const chapterNameService_1 = require("./chapterNameService");
class QuestionCreating {
    constructor() { }
    async htmlContentQuestions(payload) {
        let typeOfQuestion = payload.type;
        const postiveMarks = payload.marks;
        const negativeMarks = payload.negMarks;
        const chapterGroup = payload.chapterGroup;
        const chapterName = payload.chapter;
        const subjectName = payload.subject;
        let subject;
        if (subjectName === "chemistry")
            subject = "Chemistry";
        else if (subjectName === "mathematics")
            subject = "Mathematics";
        else
            subject = "Physics";
        if (payload.question.en.comprehension != null) {
            typeOfQuestion = "comprehension";
        }
        let questionFormat;
        if (typeOfQuestion === "mcq") {
            questionFormat = client_1.questionType.SingleCorrect;
            if (payload.question.en.comprehension != null)
                questionFormat = client_1.questionType.ComprehensionSingleCorrect;
        }
        else if (typeOfQuestion === "mcqm") {
            questionFormat = client_1.questionType.MultiCorrect;
            if (payload.question.en.comprehension != null)
                questionFormat = client_1.questionType.ComprehensionMultiCorrect;
        }
        else {
            questionFormat = client_1.questionType.Integer;
            if (payload.question.en.comprehension != null)
                questionFormat = client_1.questionType.ComprehensionInteger;
        }
        const isBonous = payload.isBonus;
        const isOutOfSyllabus = payload.isOutOfSyllabus;
        const comprehensionEn = payload.question.en.comprehension;
        const contentEn = payload.question.en.content;
        const optionsEn = payload.question.en.options;
        const correctOptionsEn = payload.question.en.correct_options;
        const correctAnswerEn = payload.question.en.answer;
        const explanationEn = payload.question.en.explanation;
        const examName = payload.exam;
        const idOfquestion = (0, crypto_1.randomUUID)();
        const chapter = await (0, chapterNameService_1.findBestChapter)({
            chapter: chapterName,
            chapterGroup: chapterGroup,
            subject: subject,
        });
        const questionResult = await imageService_1.imageUpload.imageConverstion({
            id: idOfquestion,
            content: contentEn,
            exam: examName,
            type: "question",
        });
        const contentHtml = questionResult.html;
        const questionImages = questionResult.imagePaths;
        let optionsContent = [];
        for (let i = 0; i < optionsEn.length; i++) {
            const identifier = optionsEn[i].identifier;
            const optionsContentEn = optionsEn[i].content;
            const idofoptions = (0, crypto_1.randomUUID)();
            const optionResult = await imageService_1.imageUpload.imageConverstion({
                id: `${idOfquestion}_${idofoptions}_${i}`,
                content: optionsContentEn,
                exam: examName,
                type: "option",
            });
            optionsContent.push({
                identifier: identifier,
                content: optionResult.html, // DIRECT HTML
                image: optionResult.imagePaths,
            });
        }
        // --- 4. Process Answers ---
        let answers = [];
        if (Array.isArray(correctOptionsEn))
            answers = [...correctOptionsEn];
        if (correctAnswerEn)
            answers.push(correctAnswerEn);
        answers = answers.filter((ans) => ans !== null && ans !== undefined && ans !== "");
        // --- 5. Process Comprehension (HTML ONLY) ---
        let comprehensionHtml = "";
        let comprehensionImages = [];
        if (comprehensionEn) {
            const compResult = await imageService_1.imageUpload.imageConverstion({
                id: idOfquestion,
                content: comprehensionEn,
                exam: examName,
                type: "comprehension",
            });
            comprehensionHtml = compResult.html; // DIRECT HTML
            comprehensionImages = compResult.imagePaths;
        }
        // --- 6. Process Explanation (HTML ONLY) ---
        let explationHtml = "";
        let explanationImages = [];
        if (explanationEn) {
            const expResult = await imageService_1.imageUpload.imageConverstion({
                id: idOfquestion,
                content: explanationEn,
                exam: examName,
                type: "explanation",
            });
            explationHtml = expResult.html; // DIRECT HTML
            explanationImages = expResult.imagePaths;
        }
        console.log(`Processed: ${chapter}`);
        // --- 7. Return Final Object ---
        return {
            id: idOfquestion,
            isBonus: isBonous,
            isOutOfSyllabus: isOutOfSyllabus,
            questionType: questionFormat,
            postiveMarks: postiveMarks,
            negativeMarks: negativeMarks,
            subject: subject,
            question: contentHtml, // Saving HTML
            questionImage: questionImages,
            comprehension: comprehensionHtml, // Saving HTML
            comprehensionImage: comprehensionImages,
            options: optionsContent,
            correctAnswer: answers,
            explation: explationHtml, // Saving HTML
            explationImage: explanationImages,
            chapter: chapter,
        };
    }
    async uploadBulkQuestions(fullJsonData, paperId) {
        try {
            const results = fullJsonData.results;
            let totalProcessed = 0;
            let globalQuestionCounter = 1;
            for (const subjectBlock of results) {
                const subjectName = subjectBlock._id;
                const questionsArray = subjectBlock.questions;
                console.log(`Processing Subject: ${subjectName} with ${questionsArray.length} questions.`);
                for (const qData of questionsArray) {
                    const formattedData = await this.htmlContentQuestions(qData);
                    await question_db_1.question.addingSingleQuestion(formattedData, paperId, globalQuestionCounter);
                    console.log(`Uploaded Question #${globalQuestionCounter} - ${subjectName}`);
                    globalQuestionCounter++;
                    totalProcessed++;
                }
            }
            return {
                success: true,
                message: `Successfully uploaded ${totalProcessed} questions across ${results.length} subjects.`,
                count: totalProcessed,
            };
        }
        catch (error) {
            console.error("Bulk Upload Failed:", error);
            throw error;
        }
    }
}
exports.questionService = new QuestionCreating();
