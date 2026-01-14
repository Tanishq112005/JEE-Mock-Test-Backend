"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionService = void 0;
const markdown_1 = require("../utils/markdown");
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
        if (subjectName == 'chemistry') {
            subject = 'Chemistry';
        }
        else if (subjectName == 'mathematics') {
            subject = 'Mathematics';
        }
        else {
            subject = 'Physics';
        }
        if (payload.question.en.comprehension != null) {
            typeOfQuestion = "comprehension";
        }
        let questionFormat;
        if (typeOfQuestion === 'mcq') {
            questionFormat = client_1.questionType.SingleCorrect;
        }
        else if (typeOfQuestion === 'mcqm') {
            questionFormat = client_1.questionType.MultiCorrect;
        }
        else if (typeOfQuestion === 'integer') {
            questionFormat = client_1.questionType.Integer;
        }
        else {
            questionFormat = client_1.questionType.Comprehension;
        }
        const isBonous = payload.isBonus;
        const isOutOfSyllabus = payload.isOutOfSyllabus;
        const comprehensionEn = payload.question.en.comprehension;
        const contentEn = payload.question.en.content;
        const optionsEn = payload.question.en.options;
        const correctOptionsEn = payload.question.en.correct_options;
        const correctAnswerEn = payload.question.en.answer;
        const explanationEn = payload.question.en.explanation;
        const paperTitle = payload.paperTitle;
        const examName = payload.exam;
        const idOfquestion = (0, crypto_1.randomUUID)();
        const chapter = await (0, chapterNameService_1.findBestChapter)({ chapter: chapterName,
            chapterGroup: chapterGroup,
            subject: subject });
        const examYear = payload.year;
        // step1: image uploading in the database
        const imageName = await imageService_1.imageUpload.imageConverstion({
            id: idOfquestion,
            content: contentEn,
            exam: examName,
            type: 'question'
        });
        // step2 : converting the text into the markup language
        const contentMarkup = markdown_1.markdown.convertor(contentEn);
        let optionsContent = [];
        for (let i = 0; i < optionsEn.length; i++) {
            // selecting the identifier
            const identifier = optionsEn[i].identifier;
            const optionsContentEn = optionsEn[i].content;
            const idofoptions = (0, crypto_1.randomUUID)();
            // collecting the images names
            const imageNameOptions = await imageService_1.imageUpload.imageConverstion({
                id: `${idOfquestion + '_' + idofoptions + '_' + i} `,
                content: optionsContentEn,
                exam: examName,
                type: 'option'
            });
            // converting the text into the markup
            const optionContentMarkup = markdown_1.markdown.convertor(optionsContentEn);
            optionsContent.push({
                identifier: identifier,
                content: optionContentMarkup,
                image: imageNameOptions,
            });
        }
        // step4 :  storing the answer
        let answers = [];
        // 1. Add correct_options (e.g. ["B"]) if it exists
        if (Array.isArray(correctOptionsEn)) {
            answers = [...correctOptionsEn];
        }
        // 2. Add answer (e.g. "5" or null) ONLY if it is truthy
        if (correctAnswerEn) {
            answers.push(correctAnswerEn);
        }
        // 3. SAFETY FILTER: Remove any remaining null/undefined values just in case
        answers = answers.filter(ans => ans !== null && ans !== undefined && ans !== "");
        // step5 : if the problem is compresehison
        let imageNameComprehison = [];
        let comprehensionMarkup = "";
        // ONLY process if comprehensionEn is NOT null
        if (comprehensionEn) {
            // a. image formation
            imageNameComprehison = await imageService_1.imageUpload.imageConverstion({
                id: idOfquestion,
                content: comprehensionEn,
                exam: examName,
                type: 'comprehension'
            });
            // b. comprehension in the markup
            comprehensionMarkup = markdown_1.markdown.convertor(comprehensionEn);
        }
        // step6: explanation
        let explanationImageNames = [];
        let explationContentMarkup = "";
        // ONLY process if explanationEn is NOT null
        if (explanationEn) {
            // a. imageProcessing
            explanationImageNames = await imageService_1.imageUpload.imageConverstion({
                id: idOfquestion,
                content: explanationEn,
                exam: examName,
                type: 'explanation'
            });
            // b. markdown language
            explationContentMarkup = markdown_1.markdown.convertor(explanationEn);
        }
        console.log(chapter);
        return {
            id: idOfquestion,
            isBonus: isBonous,
            isOutOfSyllabus: isOutOfSyllabus,
            questionType: questionFormat,
            postiveMarks: postiveMarks,
            negativeMarks: negativeMarks,
            subject: subject,
            question: contentMarkup,
            questionImage: imageName,
            comprehension: comprehensionMarkup,
            comprehensionImage: imageNameComprehison,
            options: optionsContent,
            correctAnswer: answers,
            explation: explationContentMarkup,
            explationImage: explanationImageNames,
            chapter: chapter
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
                    await question_db_1.question.addingSingleQuestion(formattedData, paperId);
                    console.log(`Uploaded Question #${globalQuestionCounter} - ${subjectName}`);
                    globalQuestionCounter++;
                    totalProcessed++;
                }
            }
            return {
                success: true,
                message: `Successfully uploaded ${totalProcessed} questions across ${results.length} subjects.`,
                count: totalProcessed
            };
        }
        catch (error) {
            console.error("Bulk Upload Failed:", error);
            throw error;
        }
    }
}
exports.questionService = new QuestionCreating();
