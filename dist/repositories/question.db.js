"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.question = void 0;
const client_1 = require("@prisma/client");
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
    // 2. Helper: Inject Signed URLs (CONVERTS MARKDOWN TO HTML IMG)
    // ---------------------------------------------------------
    injectUrlsIntoHtml(content, signedUrls) {
        if (!content)
            return "";
        if (!signedUrls || signedUrls.length === 0)
            return content;
        let updatedContent = content;
        signedUrls.forEach((url, index) => {
            const placeholder = `image_${index}`;
            // Regex to match Markdown image syntax: ![alt text](image_0)
            const markdownImgRegex = new RegExp(`!\\[(.*?)\\]\\(${placeholder}\\)`, 'g');
            if (markdownImgRegex.test(updatedContent)) {
                // REPLACE Markdown with HTML <img> tag
                updatedContent = updatedContent.replace(markdownImgRegex, (match, altText) => {
                    const cleanAlt = altText || `image_${index}`;
                    return `<img src="${url}" alt="${cleanAlt}" style="max-width:100%; height:auto; display:block; margin: 10px auto;" />`;
                });
            }
            else {
                // FALLBACK: If it was already HTML or just the text, replace simple placeholder
                const simpleRegex = new RegExp(placeholder, 'g');
                updatedContent = updatedContent.replace(simpleRegex, url);
            }
        });
        return updatedContent;
    }
    // ---------------------------------------------------------
    // 3. Helper: Group and Sort Questions by Type
    // ---------------------------------------------------------
    groupAndSortBySection(questions) {
        const sections = {
            MultiCorrect: [],
            SingleCorrect: [],
            Integer: [],
        };
        questions.forEach((q) => {
            switch (q.type) {
                case "MultiCorrect":
                case "ComprehensionMultiCorrect":
                case client_1.questionType.MultiCorrect:
                case client_1.questionType.ComprehensionMultiCorrect:
                    sections.MultiCorrect.push(q);
                    break;
                case "SingleCorrect":
                case "ComprehensionSingleCorrect":
                case client_1.questionType.SingleCorrect:
                case client_1.questionType.ComprehensionSingleCorrect:
                    sections.SingleCorrect.push(q);
                    break;
                case "Integer":
                case "ComprehensionInteger":
                case client_1.questionType.Integer:
                case client_1.questionType.ComprehensionInteger:
                    sections.Integer.push(q);
                    break;
                default:
                    break;
            }
        });
        const sorter = (a, b) => (a.questionNumber || 0) - (b.questionNumber || 0);
        sections.MultiCorrect.sort(sorter);
        sections.SingleCorrect.sort(sorter);
        sections.Integer.sort(sorter);
        return sections;
    }
    // ---------------------------------------------------------
    // 4. Add Single Question
    // ---------------------------------------------------------
    async addingSingleQuestion(questionData, paperId, questionNumber) {
        try {
            const updationPayload = {
                positiveMarks: questionData.postiveMarks,
                questionType: questionData.questionType,
                paperId: paperId,
            };
            await paper_db_1.paper.addingDetails(updationPayload);
            const chapterInformation = await chapter_db_1.chapter.gettingChapterId(questionData.chapter);
            await this.db.questions.create({
                data: {
                    id: questionData.id,
                    isOutOfSyllabus: questionData.isOutOfSyllabus,
                    isBonus: questionData.isBonus,
                    positiveMarks: questionData.postiveMarks,
                    negativeMarks: questionData.negativeMarks,
                    paperId: paperId,
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
    // 5. GET QUESTIONS (RETURNS ENCRYPTED)
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
            const processedQuestions = await Promise.all(questionsRaw.map(async (q) => {
                const subjectName = q.subjects?.name || null;
                const chapterName = q.chapters?.name || null;
                const examName = q.papers?.exam?.name || null;
                const isJeeMain = q.chapters?.isJeeMain ?? false;
                const isJeeAdvanced = q.chapters?.isJeeAdvanced ?? false;
                const signedQuestionImages = this.signUrlArray(q.image);
                const signedCompImages = this.signUrlArray(q.comprehensionImage);
                const finalQuestionHtml = this.injectUrlsIntoHtml(q.content, signedQuestionImages);
                const finalCompHtml = this.injectUrlsIntoHtml(q.comprehensionContent, signedCompImages);
                let processedOptions = null;
                if (q.options) {
                    const optAImgs = this.signUrlArray(q.options.optionAimage);
                    const optBImgs = this.signUrlArray(q.options.optionBimage);
                    const optCImgs = this.signUrlArray(q.options.optionCimage);
                    const optDImgs = this.signUrlArray(q.options.optionDimage);
                    processedOptions = {
                        ...q.options,
                        optionAtext: this.injectUrlsIntoHtml(q.options.optionAtext, optAImgs),
                        optionBtext: this.injectUrlsIntoHtml(q.options.optionBtext, optBImgs),
                        optionCtext: this.injectUrlsIntoHtml(q.options.optionCtext, optCImgs),
                        optionDtext: this.injectUrlsIntoHtml(q.options.optionDtext, optDImgs),
                        optionAimage: undefined,
                        optionBimage: undefined,
                        optionCimage: undefined,
                        optionDimage: undefined,
                    };
                }
                let processedSolution = null;
                if (q.solution) {
                    const solImages = this.signUrlArray(q.solution.image);
                    processedSolution = {
                        ...q.solution,
                        text: this.injectUrlsIntoHtml(q.solution.text, solImages),
                        image: undefined,
                    };
                }
                return {
                    ...q,
                    content: finalQuestionHtml,
                    comprehensionContent: finalCompHtml,
                    subject: subjectName,
                    chapter: chapterName,
                    exam: examName,
                    paperTitle: q.papers?.year ? `${examName} ${q.papers.year}` : null,
                    isJeeMain, isJeeAdvanced,
                    subjects: undefined, chapters: undefined, papers: undefined,
                    paperId: undefined, subjectId: undefined, chapterId: undefined,
                    image: undefined,
                    comprehensionImage: undefined,
                    options: processedOptions,
                    solution: processedSolution,
                };
            }));
            return (0, encryption_1.encryptPayload)(processedQuestions);
        }
        catch (err) {
            console.error("Error fetching questions:", err);
            throw err;
        }
    }
    // =================================================================
    // 6. GET QUESTIONS BY PAPER ID
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
                const finalQuestionHtml = this.injectUrlsIntoHtml(q.content, signedQuestionImages);
                const finalCompHtml = this.injectUrlsIntoHtml(q.comprehensionContent, signedCompImages);
                let processedOptions = null;
                if (q.options) {
                    const optAImgs = this.signUrlArray(q.options.optionAimage);
                    const optBImgs = this.signUrlArray(q.options.optionBimage);
                    const optCImgs = this.signUrlArray(q.options.optionCimage);
                    const optDImgs = this.signUrlArray(q.options.optionDimage);
                    processedOptions = {
                        ...q.options,
                        optionAtext: this.injectUrlsIntoHtml(q.options.optionAtext, optAImgs),
                        optionBtext: this.injectUrlsIntoHtml(q.options.optionBtext, optBImgs),
                        optionCtext: this.injectUrlsIntoHtml(q.options.optionCtext, optCImgs),
                        optionDtext: this.injectUrlsIntoHtml(q.options.optionDtext, optDImgs),
                        optionAimage: undefined,
                        optionBimage: undefined,
                        optionCimage: undefined,
                        optionDimage: undefined,
                    };
                }
                let processedSolution = null;
                if (q.solution) {
                    const solImages = this.signUrlArray(q.solution.image);
                    processedSolution = {
                        ...q.solution,
                        text: this.injectUrlsIntoHtml(q.solution.text, solImages),
                        image: undefined,
                    };
                }
                return {
                    ...q,
                    content: finalQuestionHtml,
                    comprehensionContent: finalCompHtml,
                    subject: subjectName,
                    chapter: chapterName,
                    isJeeMain, isJeeAdvanced,
                    subjects: undefined, chapters: undefined,
                    paperId: undefined, subjectId: undefined, chapterId: undefined,
                    image: undefined,
                    comprehensionImage: undefined,
                    options: processedOptions,
                    solution: processedSolution,
                };
            }));
            const physicsRaw = processedQuestions.filter((q) => q.subject === client_1.SubjectName.Physics || q.subject === "Physics");
            const chemistryRaw = processedQuestions.filter((q) => q.subject === client_1.SubjectName.Chemistry || q.subject === "Chemistry");
            const mathematicsRaw = processedQuestions.filter((q) => q.subject === client_1.SubjectName.Mathematics || q.subject === "Mathematics");
            return (0, encryption_1.encryptPayload)({
                ...paperRaw,
                exam: paperRaw.exam?.name,
                questions: undefined,
                Physics: this.groupAndSortBySection(physicsRaw),
                Chemistry: this.groupAndSortBySection(chemistryRaw),
                Mathematics: this.groupAndSortBySection(mathematicsRaw),
            });
        }
        catch (error) {
            console.error("Error fetching paper questions:", error);
            throw error;
        }
    }
    // =================================================================
    // 7. GET RAW QUESTIONS BY PAPER ID
    // =================================================================
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
                        orderBy: { id: 'asc' }
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
                const finalQuestionHtml = this.injectUrlsIntoHtml(q.content, signedQuestionImages);
                const finalCompHtml = this.injectUrlsIntoHtml(q.comprehensionContent, signedCompImages);
                let processedOptions = null;
                if (q.options) {
                    const optAImgs = this.signUrlArray(q.options.optionAimage);
                    const optBImgs = this.signUrlArray(q.options.optionBimage);
                    const optCImgs = this.signUrlArray(q.options.optionCimage);
                    const optDImgs = this.signUrlArray(q.options.optionDimage);
                    processedOptions = {
                        ...q.options,
                        optionAtext: this.injectUrlsIntoHtml(q.options.optionAtext, optAImgs),
                        optionBtext: this.injectUrlsIntoHtml(q.options.optionBtext, optBImgs),
                        optionCtext: this.injectUrlsIntoHtml(q.options.optionCtext, optCImgs),
                        optionDtext: this.injectUrlsIntoHtml(q.options.optionDtext, optDImgs),
                        optionAimage: undefined,
                        optionBimage: undefined,
                        optionCimage: undefined,
                        optionDimage: undefined,
                    };
                }
                let processedSolution = null;
                if (q.solution) {
                    const solImages = this.signUrlArray(q.solution.image);
                    processedSolution = {
                        ...q.solution,
                        text: this.injectUrlsIntoHtml(q.solution.text, solImages),
                        image: undefined,
                    };
                }
                return {
                    ...q,
                    content: finalQuestionHtml,
                    comprehensionContent: finalCompHtml,
                    subject: subjectName,
                    chapter: chapterName,
                    isJeeMain,
                    isJeeAdvanced,
                    subjects: undefined, chapters: undefined, paperId: undefined, subjectId: undefined, chapterId: undefined,
                    image: undefined,
                    comprehensionImage: undefined,
                    questionNumber: q.questionNumber,
                    options: processedOptions,
                    solution: processedSolution,
                };
            }));
            const physicsRaw = processedQuestions.filter((q) => q.subject === client_1.SubjectName.Physics || q.subject === "Physics");
            const chemistryRaw = processedQuestions.filter((q) => q.subject === client_1.SubjectName.Chemistry || q.subject === "Chemistry");
            const mathematicsRaw = processedQuestions.filter((q) => q.subject === client_1.SubjectName.Mathematics || q.subject === "Mathematics");
            return {
                paperDetails: {
                    ...paperRaw,
                    questions: undefined
                },
                Physics: this.groupAndSortBySection(physicsRaw),
                Chemistry: this.groupAndSortBySection(chemistryRaw),
                Mathematics: this.groupAndSortBySection(mathematicsRaw)
            };
        }
        catch (error) {
            console.error("Error fetching raw paper questions:", error);
            throw error;
        }
    }
    async gettingQuestionsInformation(paperId) {
        try {
            const paperDetails = await this.db.questions.findMany({
                where: {
                    paperId: paperId
                },
                include: {
                    subjects: true,
                    chapters: true,
                    papers: {
                        include: {
                            exam: true
                        }
                    }
                }
            });
            return paperDetails;
        }
        catch (err) {
        }
    }
    async gettingQuestionForChapter(chapterId, userId) {
        try {
            // in this we will take the question and also with the attempt status from the test attempt and the chapter wise attempt 
            const chapterWiseRawDetails = await this.db.questions.findMany({
                where: {
                    chapterId: chapterId
                },
                include: {
                    bookmarkedBy: {
                        where: {
                            studentId: userId
                        }
                    },
                    chapterWiseAttempts: {
                        where: {
                            studentId: userId
                        }
                    },
                    solution: true,
                    options: true,
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
    async questionStatus(questionId, userId) {
        try {
            const testAttemptQuestion = await this.db.testQuestionAttemptStatus.findMany({
                where: {
                    studentId: userId,
                    questionId: questionId,
                    isAnalyzed: true
                },
                orderBy: {
                    updated_at: 'desc'
                }
            });
            const chapterWiseQuestion = await this.db.chapterWiseQuestionAttemptStatus.findMany({
                where: {
                    studentId: userId,
                    questionId: questionId,
                    isAnalyzed: true
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            return {
                testData: testAttemptQuestion,
                chapterData: chapterWiseQuestion
            };
        }
        catch (err) {
            throw err;
        }
    }
}
exports.question = new Question(database_1.database);
