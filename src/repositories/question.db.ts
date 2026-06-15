import {
  chapters,
  PrismaClient,
  SubjectName,
  questionType,
} from "@prisma/client";
import { database } from "../lib/database";
import { questionParameters } from "../types/questions.types";
import { paper } from "./paper.db";
import { questionDetails } from "../types/paper.types";
import { chapter } from "./chapter.db";
import { backblaze } from "../lib/s3";
import { encryptPayload } from "../utils/encryption";

class Question {
  private db: PrismaClient;

  constructor(database: PrismaClient) {
    this.db = database;
  }

  // ---------------------------------------------------------
  // 1. Helper: Sign Image URLs
  // ---------------------------------------------------------
  private signUrlArray(images: string[]): string[] {
    if (!images || images.length === 0) return [];
    const signedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const link = backblaze.getImageLink(images[i]);
      signedUrls.push(link);
    }
    return signedUrls;
  }

  // ---------------------------------------------------------
  // 2. Helper: Inject Signed URLs (CONVERTS MARKDOWN TO HTML IMG)
  // ---------------------------------------------------------
  private injectUrlsIntoHtml(
    content: string | null,
    signedUrls: string[],
  ): string {
    if (!content) return "";
    if (!signedUrls || signedUrls.length === 0) return content;

    let updatedContent = content;

    signedUrls.forEach((url, index) => {
      const placeholder = `image_${index}`;

      // Regex to match Markdown image syntax: ![alt text](image_0)
      const markdownImgRegex = new RegExp(
        `!\\[(.*?)\\]\\(${placeholder}\\)`,
        "g",
      );

      if (markdownImgRegex.test(updatedContent)) {
        // REPLACE Markdown with HTML <img> tag
        updatedContent = updatedContent.replace(
          markdownImgRegex,
          (match, altText) => {
            const cleanAlt = altText || `image_${index}`;
            return `<img src="${url}" alt="${cleanAlt}" style="max-width:100%; height:auto; display:block; margin: 10px auto;" />`;
          },
        );
      } else {
        // FALLBACK: If it was already HTML or just the text, replace simple placeholder
        const simpleRegex = new RegExp(placeholder, "g");
        updatedContent = updatedContent.replace(simpleRegex, url);
      }
    });

    return updatedContent;
  }

  // ---------------------------------------------------------
  // 3. Helper: Process all media (Main, Comprehension, Options, Solution)
  // ---------------------------------------------------------
  private processQuestionMedia(q: any) {
    const finalQuestionHtml = this.injectUrlsIntoHtml(q.content, this.signUrlArray(q.image));
    const finalCompHtml = this.injectUrlsIntoHtml(q.comprehensionContent, this.signUrlArray(q.comprehensionImage));

    let processedOptions = null;
    if (q.options) {
      processedOptions = {
        ...q.options,
        optionAtext: this.injectUrlsIntoHtml(q.options.optionAtext, this.signUrlArray(q.options.optionAimage)),
        optionBtext: this.injectUrlsIntoHtml(q.options.optionBtext, this.signUrlArray(q.options.optionBimage)),
        optionCtext: this.injectUrlsIntoHtml(q.options.optionCtext, this.signUrlArray(q.options.optionCimage)),
        optionDtext: this.injectUrlsIntoHtml(q.options.optionDtext, this.signUrlArray(q.options.optionDimage)),
        optionAimage: undefined,
        optionBimage: undefined,
        optionCimage: undefined,
        optionDimage: undefined,
      };
    }

    let processedSolution = null;
    if (q.solution) {
      processedSolution = {
        ...q.solution,
        text: this.injectUrlsIntoHtml(q.solution.text, this.signUrlArray(q.solution.image)),
        image: undefined,
      };
    }

    return { finalQuestionHtml, finalCompHtml, processedOptions, processedSolution };
  }

  private getOptionByIdentifier(
    options: questionParameters["options"],
    identifier: "A" | "B" | "C" | "D",
    fallbackIndex: number,
  ) {
    return (
      options.find(
        (option) => option.identifier?.toUpperCase() === identifier,
      ) ?? options[fallbackIndex]
    );
  }

  // ---------------------------------------------------------
  // 4. Helper: Flatten relationships and apply naming changes
  // ---------------------------------------------------------
  private formatQuestionRecord(q: any, removeRelations: boolean = true) {
    const media = this.processQuestionMedia(q);
    const examName = q.papers?.exam?.name || null;

    const formattedQuestion = {
      ...q,
      // Inject Processed Media
      content: media.finalQuestionHtml,
      comprehensionContent: media.finalCompHtml,
      options: media.processedOptions,
      solution: media.processedSolution,

      // Flatten Relationships (Naming Changes)
      subject: q.subjects?.name || null,
      chapter: q.chapters?.name || null,
      exam: examName,
      paperTitle: q.papers?.year ? `${examName} ${q.papers.year}` : null,
      // isJeeMain: q.chapters?.isJeeMain ?? false,
      // isJeeAdvanced: q.chapters?.isJeeAdvanced ?? false,

      // Clean up raw image arrays
      image: undefined,
      comprehensionImage: undefined,
    };

    // Optionally remove nested Prisma objects
    if (removeRelations) {
      formattedQuestion.subjects = undefined;
      formattedQuestion.chapters = undefined;
      formattedQuestion.papers = undefined;
      formattedQuestion.paperId = undefined;
      formattedQuestion.subjectId = undefined;
      formattedQuestion.chapterId = undefined;
    }
    
    // Always remove bookmarkedBy array to avoid leaking student data
    formattedQuestion.bookmarkedBy = undefined;

    return formattedQuestion;
  }

  // ---------------------------------------------------------
  // 5. Helper: Group and Sort Questions by Type
  // ---------------------------------------------------------
  private groupAndSortBySection(questions: any[]) {
    const sections = {
      MultiCorrect: [] as any[],
      SingleCorrect: [] as any[],
      Integer: [] as any[],
    };

    questions.forEach((q) => {
      switch (q.type) {
        case "MultiCorrect":
        case "ComprehensionMultiCorrect":
        case questionType.MultiCorrect:
        case questionType.ComprehensionMultiCorrect:
          sections.MultiCorrect.push(q);
          break;

        case "SingleCorrect":
        case "ComprehensionSingleCorrect":
        case questionType.SingleCorrect:
        case questionType.ComprehensionSingleCorrect:
          sections.SingleCorrect.push(q);
          break;

        case "Integer":
        case "ComprehensionInteger":
        case questionType.Integer:
        case questionType.ComprehensionInteger:
          sections.Integer.push(q);
          break;

        default:
          break;
      }
    });

    const sorter = (a: any, b: any) =>
      (a.questionNumber || 0) - (b.questionNumber || 0);
    sections.MultiCorrect.sort(sorter);
    sections.SingleCorrect.sort(sorter);
    sections.Integer.sort(sorter);

    return sections;
  }

  // ---------------------------------------------------------
  // 6. Add Single Question
  // ---------------------------------------------------------
  async addingSingleQuestion(
    questionData: questionParameters,
    paperId: string,
    questionNumber: number,
  ) {
    try {
      const updationPayload: questionDetails = {
        positiveMarks: questionData.postiveMarks,
        questionType: questionData.questionType,
        negativeMarks : questionData.negativeMarks , 
        paperId: paperId,
      };
      await paper.addingDetails(updationPayload);
      const chapterInformation: chapters = await chapter.gettingChapterId(
        questionData.chapter,
      );
      const optionA = this.getOptionByIdentifier(questionData.options, "A", 0);
      const optionB = this.getOptionByIdentifier(questionData.options, "B", 1);
      const optionC = this.getOptionByIdentifier(questionData.options, "C", 2);
      const optionD = this.getOptionByIdentifier(questionData.options, "D", 3);

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
          options: questionData.options
            ? {
                create: {
                  optionAtext: optionA?.content ?? "",
                  optionAimage: optionA?.image ?? [],
                  optionBtext: optionB?.content ?? "",
                  optionBimage: optionB?.image ?? [],
                  optionCtext: optionC?.content ?? "",
                  optionCimage: optionC?.image ?? [],
                  optionDtext: optionD?.content ?? "",
                  optionDimage: optionD?.image ?? [],
                },
              }
            : undefined,
          solution: {
            create: {
              text: questionData.explation,
              image: questionData.explationImage,
            },
          },
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async deletingQuestion(questionId: string) {
    try {
      await this.db.questions.delete({ where: { id: questionId } });
    } catch (err) {
      throw err;
    }
  }

  // =================================================================
  // 7. GET QUESTIONS (RETURNS ENCRYPTED)
  // =================================================================
  async gettingQuestion(
    year?: number,
    chapterId?: string,
    paperId?: string,
    questionId?: string,
    subject?: SubjectName,
  ) {
    try {
      const whereQuery: any = {};
      if (questionId) whereQuery.id = questionId;
      if (paperId) whereQuery.paperId = paperId;
      if (chapterId) whereQuery.chapterId = chapterId;
      if (subject) whereQuery.subjects = { name: subject };
      if (year) whereQuery.papers = { year: year };

      const questionsRaw = await this.db.questions.findMany({
        where: whereQuery,
        include: {
          options: true,
          solution: true,
          subjects: { select: { name: true } },
          chapters: {
            select: {
              name: true,
              isJeeAdvanced: true,
              isJeeMain: true,
              chapterNumber: true,
            },
          },
          papers: {
            select: {
              mode: true,
              shift: true,
              date: true,
              month: true,
              year: true,
              exam: { select: { name: true } },
              session : true 
            },
          },
        },
        orderBy: { papers: { year: "desc" } },
      });

      const processedQuestions = questionsRaw.map((q) =>
        this.formatQuestionRecord(q, true),
      );

      return processedQuestions;
    } catch (err) {
      console.error("Error fetching questions:", err);
      throw err;
    }
  }

  async getQuestionsByPaperId(paperId: string, studentId?: string) {
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
                select: { name: true, isJeeAdvanced: true, isJeeMain: true },
              },
              ...(studentId ? { bookmarkedBy: { where: { studentId } } } : {})
            },
          },
        },
      });

      if (!paperRaw) return null;

      const processedQuestions = paperRaw.questions.map((q: any) => {
        const formatted = this.formatQuestionRecord(q, true);
        if (studentId) {
          formatted.isBookmarked = q.bookmarkedBy && q.bookmarkedBy.length > 0;
        }
        return formatted;
      });

      const physicsRaw = processedQuestions.filter(
        (q: any) =>
          q.subject === SubjectName.Physics || q.subject === "Physics",
      );
      const chemistryRaw = processedQuestions.filter(
        (q: any) =>
          q.subject === SubjectName.Chemistry || q.subject === "Chemistry",
      );
      const mathematicsRaw = processedQuestions.filter(
        (q: any) =>
          q.subject === SubjectName.Mathematics || q.subject === "Mathematics",
      );

      return encryptPayload({
        ...paperRaw,
        exam: paperRaw.exam?.name,
        questions: undefined,
        Physics: this.groupAndSortBySection(physicsRaw),
        Chemistry: this.groupAndSortBySection(chemistryRaw),
        Mathematics: this.groupAndSortBySection(mathematicsRaw),
      });
    } catch (error) {
      console.error("Error fetching paper questions:", error);
      throw error;
    }
  }

  // =================================================================
  // 9. GET RAW QUESTIONS BY PAPER ID
  // =================================================================
  async getRawQuestionsForPaper(paperId: string, userId?: string) {
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
                select: { name: true, isJeeAdvanced: true, isJeeMain: true },
              },
              ...(userId ? { bookmarkedBy: { where: { studentId: userId } } } : {})
            },
            orderBy: { id: "asc" },
          },
        },
      });

      if (!paperRaw) return null;

      const processedQuestions = paperRaw.questions.map((q: any) => {
        const formatted = this.formatQuestionRecord(q, true);
        if (userId) {
          formatted.isBookmarked = q.bookmarkedBy && q.bookmarkedBy.length > 0;
        }
        return formatted;
      });

      const physicsRaw = processedQuestions.filter(
        (q: any) =>
          q.subject === SubjectName.Physics || q.subject === "Physics",
      );
      const chemistryRaw = processedQuestions.filter(
        (q: any) =>
          q.subject === SubjectName.Chemistry || q.subject === "Chemistry",
      );
      const mathematicsRaw = processedQuestions.filter(
        (q: any) =>
          q.subject === SubjectName.Mathematics || q.subject === "Mathematics",
      );

      return {
        paperDetails: {
          ...paperRaw,
          questions: undefined,
        },
        Physics: this.groupAndSortBySection(physicsRaw),
        Chemistry: this.groupAndSortBySection(chemistryRaw),
        Mathematics: this.groupAndSortBySection(mathematicsRaw),
      };
    } catch (error) {
      console.error("Error fetching raw paper questions:", error);
      throw error;
    }
  }

  async gettingQuestionsInformation(paperId: string) {
    try {
      const paperDetails = await this.db.questions.findMany({
        where: {
          paperId: paperId,
        },
        include: {
          subjects: true,
          chapters: true,
          papers: {
            include: {
              exam: true,
            },
          },
        },
      });

      return paperDetails;
    } catch (err: any) {}
  }

  async gettingQuestionForChapter(chapterId: string, userId: string) {
    try {
      // in this we will take the question and also with the attempt status from the test attempt and the chapter wise attempt
      const chapterWiseRawDetails = await this.db.questions.findMany({
        where: {
          chapterId: chapterId,
        },
        include: {
          bookmarkedBy: {
            where: {
              studentId: userId,
            },
          },
          chapterWiseAttempts: {
            where: {
              studentId: userId,
            },
          },
          solution: true,
          options: true,
        },
      });
      const mappedDetails = chapterWiseRawDetails.map((q: any) => {
        const isBookmarked = q.bookmarkedBy && q.bookmarkedBy.length > 0;
        const qCopy = { ...q, isBookmarked };
        delete qCopy.bookmarkedBy;
        return qCopy;
      });

      return mappedDetails;
    } catch (err: any) {
      throw err;
    }
  }

  async questionStatus(questionId: string, userId: string) {
    try {
      const testAttemptQuestion =
        await this.db.testQuestionAttemptStatus.findMany({
          where: {
            studentId: userId,
            questionId: questionId,
            isAnalyzed: true,
          },
          orderBy: {
            updated_at: "desc",
          },
        });

      const chapterWiseQuestion =
        await this.db.chapterWiseQuestionAttemptStatus.findMany({
          where: {
            studentId: userId,
            questionId: questionId,
            isAnalyzed: true,
          },
          orderBy: {
            created_at: "desc",
          },
        });

      return {
        testData: testAttemptQuestion,
        chapterData: chapterWiseQuestion,
      };
    } catch (err: any) {
      throw err;
    }
  }

  // =================================================================
  // 10. GET GLOBAL QUESTIONS WITH SIGNED URLS
  // =================================================================
  public async getGlobalQuestionsWithSignedUrls(
    filters: { chapterId?: string; paperId?: string; questionId?: string; year?: number; subject?: SubjectName },
    studentId?: string,
    removeRelations: boolean = true
  ) {
    const whereQuery: any = {};
    if (filters.questionId) whereQuery.id = filters.questionId;
    if (filters.paperId) whereQuery.paperId = filters.paperId;
    if (filters.chapterId) whereQuery.chapterId = filters.chapterId;
    if (filters.subject) whereQuery.subjects = { name: filters.subject };
    if (filters.year) whereQuery.papers = { year: filters.year };

    const questionsRaw = await this.db.questions.findMany({
      where: whereQuery,
      include: {
        options: true,
        solution: true,
        subjects: { select: { name: true } },
        chapters: {
          select: {
            name: true,
            isJeeAdvanced: true,
            isJeeMain: true,
            chapterNumber: true,
          },
        },
        papers: {
          select: {
            mode: true,
            shift: true,
            date: true,
            month: true,
            year: true,
            exam: { select: { name: true } },
            session: true,
          },
        },
        ...(studentId ? { bookmarkedBy: { where: { studentId } } } : {})
      },
      orderBy: { papers: { year: "desc" } },
    });

    const processedQuestions = questionsRaw.map((q: any) => {
      const formatted = this.formatQuestionRecord(q, removeRelations);
      if (studentId) {
        formatted.isBookmarked = q.bookmarkedBy && q.bookmarkedBy.length > 0;
      }
      return formatted;
    });

    return processedQuestions;
  }

  // =================================================================
  // 11. GET QUESTIONS WITH SIGNED URLS (UNENCRYPTED)
  // =================================================================
  public async getQuestionsWithSignedUrls(chapterId: string) {
    const questionsRaw = await this.db.questions.findMany({
      where: { chapterId },
      include: {
        options: true,
        solution: true,
        subjects: { select: { name: true } },
        chapters: {
          select: {
            name: true,
            isJeeAdvanced: true,
            isJeeMain: true,
            chapterNumber: true,
          },
        },
        papers: {
          select: {
            mode: true,
            shift: true,
            date: true,
            month: true,
            year: true,
            exam: { select: { name: true } },
            session : true 
            
          },
        },
      },
      orderBy: { papers: { year: "desc" } },
    });

    // CRITICAL: We do NOT set `papers: undefined` here so ChapterWisePractice can use it!
    const processedQuestions = questionsRaw.map((q) =>
      this.formatQuestionRecord(q, false),
    );

    return processedQuestions;
  }

  // =================================================================
  // 11. GET SINGLE QUESTION BY ID WITH SIGNED URLS (UNENCRYPTED)
  // =================================================================
  public async getQuestionByIdWithSignedUrls(questionId: string) {
    try {
      const q = await this.db.questions.findUnique({
        where: { id: questionId },
        include: {
          options: true,
          solution: true,
          subjects: { select: { name: true } },
          chapters: {
            select: { name: true, isJeeAdvanced: true, isJeeMain: true, chapterNumber: true },
          },
          papers: {
            select: { mode: true, shift: true, date: true, month: true, year: true, exam: { select: { name: true } } },
          },
        },
      });

      if (!q) return null;

      // Passing `false` to keep relation objects intact (like papers)
      return this.formatQuestionRecord(q, false);
    } catch (err) {
      console.error(`Error fetching question by ID: ${questionId}`, err);
      throw err;
    }
  }
}

export const question = new Question(database);
