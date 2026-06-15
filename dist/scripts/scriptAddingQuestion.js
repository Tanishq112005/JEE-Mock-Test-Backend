"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addingCorrectChapterName = void 0;
const database_1 = require("../lib/database");
const htmlPraser_1 = require("../utils/htmlPraser");
const chapter_db_1 = require("../repositories/chapter.db");
class AddingCorrectChapterName {
    db;
    constructor(database) {
        this.db = database;
    }
    async gettingQuestions(paperId) {
        try {
            const gettingPaper = await this.db.questions.findMany({
                where: {
                    paperId: paperId
                }
            });
            return gettingPaper;
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    async gettingChapterName(name) {
        try {
            const chapterDetails = await this.db.chapters.findFirst({
                where: {
                    name: name
                }
            });
            return chapterDetails;
        }
        catch (err) {
            throw err;
        }
    }
    async updatingChapterName(chapterId, questionId) {
        try {
            const updateChapter = await this.db.questions.update({
                where: {
                    id: questionId
                },
                data: {
                    chapterId: chapterId
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async processingQuestions(paperId, data) {
        try {
            const gettingWholeQuestions = await this.gettingQuestions(paperId);
            for (let subjectIndex = 0; subjectIndex < data.length; subjectIndex++) {
                const subjectData = data[subjectIndex];
                const subjectName = subjectData.title; // e.g., "Physics", "Chemistry", "Mathematics"
                const subjectQuestions = subjectData.questions;
                for (let i = 0; i < subjectQuestions.length; i++) {
                    const questionContent = subjectQuestions[i].question.en.content;
                    const questionCompheresionContent = subjectQuestions[i].question.en.comprehension;
                    const questionPositiveMarks = subjectQuestions[i].marks;
                    const questionNegativeMarks = subjectQuestions[i].negMarks;
                    const questionHTMLContent = htmlPraser_1.htmlParser.processContent(questionContent).html;
                    const questionHTMLCompheresionContent = questionCompheresionContent ? htmlPraser_1.htmlParser.processContent(questionCompheresionContent).html : "";
                    const questionChaterName = subjectQuestions[i].chapter;
                    const groupName = subjectQuestions[i].chapterGroup;
                    for (let j = 0; j < gettingWholeQuestions.length; j++) {
                        if (gettingWholeQuestions[j].content == questionHTMLContent &&
                            gettingWholeQuestions[j].comprehensionContent == questionHTMLCompheresionContent &&
                            gettingWholeQuestions[j].positiveMarks == questionPositiveMarks &&
                            gettingWholeQuestions[j].negativeMarks == questionNegativeMarks) {
                            try {
                                console.log("asking for the chapter name");
                                const chapterDetails = await this.gettingChapterName(questionChaterName);
                                if (!chapterDetails) {
                                    throw new Error("Chapter not found");
                                }
                                const chapterId = chapterDetails.id;
                                console.log(chapterId);
                                await this.updatingChapterName(chapterId, gettingWholeQuestions[j].id);
                            }
                            catch (err) {
                                // if chapter Name is not found then
                                await chapter_db_1.chapter.addingChapter({
                                    name: questionChaterName,
                                    group: groupName,
                                    isCbse: true,
                                    isJeeAdvanced: true,
                                    isJeeMain: true,
                                    subject: subjectName, // "Physics", "Chemistry", "Mathematics"
                                    chapterNumber: 1,
                                    classNumber: 11
                                });
                                const chapterDetails = await this.gettingChapterName(questionChaterName);
                                if (chapterDetails) {
                                    const chapterId = chapterDetails.id;
                                    await this.updatingChapterName(chapterId, gettingWholeQuestions[j].id);
                                }
                            }
                        }
                    }
                }
            }
            console.log("Successfully processed questions for all subjects.");
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
}
exports.addingCorrectChapterName = new AddingCorrectChapterName(database_1.database);
