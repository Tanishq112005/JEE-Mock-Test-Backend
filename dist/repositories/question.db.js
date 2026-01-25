"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.question = void 0;
const database_1 = require("../lib/database");
const paper_db_1 = require("./paper.db");
const chapter_db_1 = require("./chapter.db");
const s3_1 = require("../lib/s3");
const encryption_1 = require("../utils/encryption");
class Question {
    db;
    constructor(database) {
        this.db = database;
    }
    // ---------------------------------------------------------
    // 1. Helper: Sign Image URLs
    // ---------------------------------------------------------
    signUrlArray(images) {
        if (!images || images.length === 0)
            return [];
        const signedUrls = [];
        for (let i = 0; i < images.length; i++) {
            const link = s3_1.backblaze.getImageLink(images[i]);
            signedUrls.push(link);
        }
        return signedUrls;
    }
    // ---------------------------------------------------------
    // 2. Add Single Question (SAVES PLAIN TEXT TO DB)
    // ---------------------------------------------------------
    async addingSingleQuestion(questionData, paperId, questionNumber) {
        try {
            const actualPaperId = paperId;
            const updationPayload = {
                positiveMarks: questionData.postiveMarks,
                questionType: questionData.questionType,
                paperId: actualPaperId,
            };
            await paper_db_1.paper.addingDetails(updationPayload);
            const chapterInformation = await chapter_db_1.chapter.gettingChapterId(questionData.chapter);
            // Save content AS IS (Plain Text) so you can read/edit in DB
            await this.db.questions.create({
                data: {
                    id: questionData.id,
                    isOutOfSyllabus: questionData.isOutOfSyllabus,
                    isBonus: questionData.isBonus,
                    positiveMarks: questionData.postiveMarks,
                    negativeMarks: questionData.negativeMarks,
                    paperId: actualPaperId,
                    content: questionData.question,
                    image: questionData.questionImage,
                    comprehensionContent: questionData.comprehension,
                    comprehensionImage: questionData.comprehensionImage,
                    correctAnswer: questionData.correctAnswer,
                    type: questionData.questionType,
                    chapterId: chapterInformation.id,
                    subjectId: chapterInformation.subjectId,
                    class: chapterInformation.class,
                    questionNumber: questionNumber,
                    options: questionData.options ? {
                        create: {
                            optionAtext: questionData.options[0]?.content ?? "",
                            optionAimage: questionData.options[0]?.image ?? [],
                            optionBtext: questionData.options[1]?.content ?? "",
                            optionBimage: questionData.options[1]?.image ?? [],
                            optionCtext: questionData.options[2]?.content ?? "",
                            optionCimage: questionData.options[2]?.image ?? [],
                            optionDtext: questionData.options[3]?.content ?? "",
                            optionDimage: questionData.options[3]?.image ?? [],
                        }
                    } : undefined,
                    solution: {
                        create: {
                            text: questionData.explation,
                            image: questionData.explationImage,
                        },
                    },
                },
            });
        }
        catch (err) {
            throw err;
        }
    }
    async deletingQuestion(questionId) {
        try {
            await this.db.questions.delete({ where: { id: questionId } });
        }
        catch (err) {
            throw err;
        }
    }
    // =================================================================
    // 3. GET QUESTIONS (RETURNS SINGLE ENCRYPTED STRING)
    // =================================================================
    async gettingQuestion(year, chapterId, paperId, questionId, subject) {
        try {
            const whereQuery = {};
            if (questionId)
                whereQuery.id = questionId;
            if (paperId)
                whereQuery.paperId = paperId;
            if (chapterId)
                whereQuery.chapterId = chapterId;
            if (subject)
                whereQuery.subjects = { name: subject };
            if (year)
                whereQuery.papers = { year: year };
            // 1. Fetch Plain Data
            const questionsRaw = await this.db.questions.findMany({
                where: whereQuery,
                include: {
                    options: true,
                    solution: true,
                    subjects: { select: { name: true } },
                    chapters: {
                        select: { name: true, isJeeAdvanced: true, isJeeMain: true, chapterNumber: true }
                    },
                    papers: {
                        select: {
                            mode: true, shift: true, date: true, month: true, year: true,
                            exam: { select: { name: true } }
                        }
                    },
                },
                orderBy: { papers: { year: "desc" } },
            });
            // 2. Process Images & Structure (Still in Memory)
            const processedQuestions = await Promise.all(questionsRaw.map(async (q) => {
                const subjectName = q.subjects?.name || null;
                const chapterName = q.chapters?.name || null;
                const examName = q.papers?.exam?.name || null;
                const isJeeMain = q.chapters?.isJeeMain ?? false;
                const isJeeAdvanced = q.chapters?.isJeeAdvanced ?? false;
                const signedQuestionImages = this.signUrlArray(q.image);
                const signedCompImages = this.signUrlArray(q.comprehensionImage);
                let processedOptions = null;
                if (q.options) {
                    processedOptions = {
                        ...q.options,
                        optionAimage: this.signUrlArray(q.options.optionAimage),
                        optionBimage: this.signUrlArray(q.options.optionBimage),
                        optionCimage: this.signUrlArray(q.options.optionCimage),
                        optionDimage: this.signUrlArray(q.options.optionDimage),
                    };
                }
                let processedSolution = null;
                if (q.solution) {
                    processedSolution = {
                        ...q.solution,
                        image: this.signUrlArray(q.solution.image),
                    };
                }
                return {
                    ...q,
                    subject: subjectName,
                    chapter: chapterName,
                    exam: examName,
                    paperTitle: q.papers?.year ? `${examName} ${q.papers.year}` : null,
                    isJeeMain, isJeeAdvanced,
                    // Remove relations
                    subjects: undefined, chapters: undefined, papers: undefined,
                    paperId: undefined, subjectId: undefined, chapterId: undefined,
                    questionNumber: q.questionNumber,
                    image: signedQuestionImages,
                    comprehensionImage: signedCompImages,
                    options: processedOptions,
                    solution: processedSolution,
                };
            }));
            // 3. ENCRYPT EVERYTHING IN ONE GO
            // This returns a string like "iv:encrypted_blob"
            return (0, encryption_1.encryptPayload)(processedQuestions);
        }
        catch (err) {
            console.error("Error fetching questions:", err);
            throw err;
        }
    }
    // =================================================================
    // 4. GET QUESTIONS BY PAPER ID (RETURNS SINGLE ENCRYPTED STRING)
    // =================================================================
    async getQuestionsByPaperId(paperId) {
        try {
            const paperRaw = await this.db.papers.findUnique({
                where: { id: paperId },
                include: {
                    exam: { select: { name: true } },
                    questions: {
                        include: {
                            options: true,
                            solution: true,
                            subjects: { select: { name: true } },
                            chapters: {
                                select: { name: true, isJeeAdvanced: true, isJeeMain: true }
                            },
                        },
                    },
                },
            });
            if (!paperRaw)
                return null;
            const processedQuestions = await Promise.all(paperRaw.questions.map(async (q) => {
                const subjectName = q.subjects?.name || null;
                const chapterName = q.chapters?.name || null;
                const isJeeMain = q.chapters?.isJeeMain ?? false;
                const isJeeAdvanced = q.chapters?.isJeeAdvanced ?? false;
                const signedQuestionImages = this.signUrlArray(q.image);
                const signedCompImages = this.signUrlArray(q.comprehensionImage);
                let processedOptions = null;
                if (q.options) {
                    processedOptions = {
                        ...q.options,
                        optionAimage: this.signUrlArray(q.options.optionAimage),
                        optionBimage: this.signUrlArray(q.options.optionBimage),
                        optionCimage: this.signUrlArray(q.options.optionCimage),
                        optionDimage: this.signUrlArray(q.options.optionDimage),
                    };
                }
                let processedSolution = null;
                if (q.solution) {
                    processedSolution = {
                        ...q.solution,
                        image: this.signUrlArray(q.solution.image),
                    };
                }
                return {
                    ...q,
                    subject: subjectName,
                    chapter: chapterName,
                    isJeeMain, isJeeAdvanced,
                    questionNumber: q.questionNumber,
                    subjects: undefined, chapters: undefined,
                    paperId: undefined, subjectId: undefined, chapterId: undefined,
                    image: signedQuestionImages,
                    comprehensionImage: signedCompImages,
                    options: processedOptions,
                    solution: processedSolution,
                };
            }));
            const finalObject = {
                ...paperRaw,
                exam: paperRaw.exam?.name,
                questions: processedQuestions,
            };
            // 3. ENCRYPT EVERYTHING IN ONE GO
            return (0, encryption_1.encryptPayload)(finalObject);
        }
        catch (error) {
            console.error("Error fetching paper questions:", error);
            throw error;
        }
    }
    async getRawQuestionsForPaper(paperId) {
        try {
            const paperRaw = await this.db.papers.findUnique({
                where: { id: paperId },
                include: {
                    exam: { select: { name: true } },
                    questions: {
                        include: {
                            options: true,
                            solution: true,
                            subjects: { select: { name: true } },
                            chapters: {
                                select: { name: true, isJeeAdvanced: true, isJeeMain: true }
                            },
                        },
                        orderBy: { id: 'asc' } // Ensure consistent ordering
                    },
                },
            });
            if (!paperRaw)
                return null;
            // Process images just like before
            const processedQuestions = await Promise.all(paperRaw.questions.map(async (q) => {
                const subjectName = q.subjects?.name || null;
                const chapterName = q.chapters?.name || null;
                const isJeeMain = q.chapters?.isJeeMain ?? false;
                const isJeeAdvanced = q.chapters?.isJeeAdvanced ?? false;
                return {
                    ...q,
                    subject: subjectName,
                    chapter: chapterName,
                    isJeeMain,
                    isJeeAdvanced,
                    subjects: undefined, chapters: undefined, paperId: undefined, subjectId: undefined, chapterId: undefined,
                    image: this.signUrlArray(q.image),
                    comprehensionImage: this.signUrlArray(q.comprehensionImage),
                    questionNumber: q.questionNumber,
                    options: q.options ? {
                        ...q.options,
                        optionAimage: this.signUrlArray(q.options.optionAimage),
                        optionBimage: this.signUrlArray(q.options.optionBimage),
                        optionCimage: this.signUrlArray(q.options.optionCimage),
                        optionDimage: this.signUrlArray(q.options.optionDimage),
                    } : null,
                    solution: q.solution ? {
                        ...q.solution,
                        image: this.signUrlArray(q.solution.image),
                    } : null,
                };
            }));
            return {
                paperDetails: {
                    ...paperRaw,
                    questions: undefined // Remove questions from top level to keep it clean
                },
                questions: processedQuestions
            };
        }
        catch (error) {
            console.error("Error fetching raw paper questions:", error);
            throw error;
        }
    }
}
exports.question = new Question(database_1.database);
