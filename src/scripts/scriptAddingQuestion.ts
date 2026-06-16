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

    async processingQuestions(paperId: string, data: any) {
        try {
            const gettingWholeQuestions = await this.gettingQuestions(paperId);
            
            // 1. Fetch all existing chapters and build an in-memory map
            const allChapters = await this.db.chapters.findMany();
            const chapterMap = new Map<string, string>();
            allChapters.forEach(ch => chapterMap.set(ch.name.trim().toLowerCase(), ch.id));

            // 2. Prepare an object to group questions by chapterId for bulk update
            const updatesByChapterId: Record<string, string[]> = {};

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
                            
                            const normalizedChapterName = questionChaterName.trim().toLowerCase();
                            let chapterId = chapterMap.get(normalizedChapterName);

                            // If chapter is not found in memory map, create it in DB and update the map
                            if (!chapterId) {
                                try {
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
                                } catch (err: any) {
                                    // P2002 means the chapter name already exists in the DB (unique constraint)
                                    if (err.code !== 'P2002') {
                                        throw err;
                                    }
                                }

                                // Fetch the newly created (or existing) chapter to get its ID
                                const newChapter = await this.db.chapters.findFirst({
                                    where: { name: questionChaterName }
                                });

                                if (newChapter) {
                                    chapterId = newChapter.id;
                                    chapterMap.set(normalizedChapterName, chapterId);
                                }
                            }

                            // If we have a valid chapter ID, stage it for bulk update
                            if (chapterId) {
                                if (!updatesByChapterId[chapterId]) {
                                    updatesByChapterId[chapterId] = [];
                                }
                                updatesByChapterId[chapterId].push(gettingWholeQuestions[j].id);
                            }
                        }
                    }
                }
            }

            // 3. Perform bulk updates in a single transaction
            const chapterUpdates = Object.entries(updatesByChapterId);

            if (chapterUpdates.length > 0) {
                await this.db.$transaction(
                    async (tx) => {
                        for (const [chapterId, questionIds] of chapterUpdates) {
                            await tx.questions.updateMany({
                                where: { id: { in: questionIds } },
                                data: { chapterId: chapterId }
                            });
                        }
                    },
                    {
                        maxWait: 10000, // 10 seconds max wait to acquire transaction
                        timeout: 60000, // 60 seconds transaction timeout
                    }
                );
                console.log(`Successfully performed bulk update for ${chapterUpdates.length} chapters.`);
            } else {
                console.log("No questions required updating.");
            }

            console.log("Successfully processed questions for all subjects.");
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

export const addingCorrectChapterName = new AddingCorrectChapterName(database);
