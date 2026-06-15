import { PrismaClient } from "@prisma/client";
import { database } from "../lib/database";
import { htmlParser } from "../utils/htmlPraser";
import { chapter } from "../repositories/chapter.db";

class AddingCorrectChapterName {
    private db: PrismaClient;

    constructor(database: PrismaClient) {
        this.db = database;
    }

    async gettingQuestions(paperId: string) {
        try {
            const gettingPaper = await this.db.questions.findMany({
                where: {
                    paperId: paperId
                }
            });

            return gettingPaper;
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    }

    async gettingChapterName(name: string) {
        try {
            const chapterDetails = await this.db.chapters.findFirst({
                where: {
                    name: name
                }
            });

            return chapterDetails;
        } catch (err: any) {
            throw err;
        }
    }

    async updatingChapterName(chapterId: string, questionId: string) {
        try {
            const updateChapter = await this.db.questions.update({
                where: {
                    id: questionId
                },
                data: {
                    chapterId: chapterId
                }
            });
        } catch (err: any) {
            throw err;
        }
    }

    async processingQuestions(paperId: string, data: any) {
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
                    
                    const questionHTMLContent = htmlParser.processContent(questionContent).html;
                    const questionHTMLCompheresionContent = questionCompheresionContent ? htmlParser.processContent(questionCompheresionContent).html : "";
                    
                    const questionChaterName = subjectQuestions[i].chapter;
                    const groupName = subjectQuestions[i].chapterGroup;

                    for (let j = 0; j < gettingWholeQuestions.length; j++) {
                        if (
                            gettingWholeQuestions[j].content == questionHTMLContent &&
                            gettingWholeQuestions[j].comprehensionContent == questionHTMLCompheresionContent &&
                            gettingWholeQuestions[j].positiveMarks == questionPositiveMarks &&
                            gettingWholeQuestions[j].negativeMarks == questionNegativeMarks
                        ) {
                            try {
                                console.log("asking for the chapter name") ; 
                                
                                const chapterDetails = await this.gettingChapterName(questionChaterName);
                                if (!chapterDetails) {
                                    throw new Error("Chapter not found");
                                }
                                const chapterId = chapterDetails.id;
                                console.log(chapterId); 
                                await this.updatingChapterName(chapterId, gettingWholeQuestions[j].id);
                            } catch (err: any) {
                                // if chapter Name is not found then
                                await chapter.addingChapter({
                                    name: questionChaterName,
                                    group: groupName,
                                    isCbse: true,
                                    isJeeAdvanced: true,
                                    isJeeMain: true,
                                    subject: subjectName as any, // "Physics", "Chemistry", "Mathematics"
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
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

export const addingCorrectChapterName = new AddingCorrectChapterName(database);
