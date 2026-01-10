import { chapters, PrismaClient, SubjectName } from "@prisma/client";
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
  private async signUrlArray(images: string[]): Promise<string[]> {
    if (!images || images.length === 0) return [];
    const signedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const link = await backblaze.getImageLink(images[i]);
      signedUrls.push(link);
    }
    return signedUrls;
  }

  // ---------------------------------------------------------
  // 2. Add Single Question (SAVES PLAIN TEXT TO DB)
  // ---------------------------------------------------------
  async addingSingleQuestion(questionData: questionParameters, paperId: string) {
    try {
      const actualPaperId = paperId;
      const updationPayload: questionDetails = {
        positiveMarks: questionData.postiveMarks,
        questionType: questionData.questionType,
        paperId: actualPaperId,
      };
      await paper.addingDetails(updationPayload);
      const chapterInformation: chapters = await chapter.gettingChapterId(questionData.chapter);

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
    } catch (err) {
      throw err;
    }
  }

  async deletingQuestion(questionId: string) {
      try {
          await this.db.questions.delete({ where: { id: questionId } })
      } catch (err) { throw err; }
  }


  // =================================================================
  // 3. GET QUESTIONS (RETURNS SINGLE ENCRYPTED STRING)
  // =================================================================
  async gettingQuestion(
    year?: number,
    chapterId?: string,
    paperId?: string,
    questionId?: string,
    subject?: SubjectName
  ) {
    try {
      const whereQuery: any = {};
      if (questionId) whereQuery.id = questionId;
      if (paperId) whereQuery.paperId = paperId;
      if (chapterId) whereQuery.chapterId = chapterId;
      if (subject) whereQuery.subjects = { name: subject };
      if (year) whereQuery.papers = { year: year };

      // 1. Fetch Plain Data
      const questionsRaw = await this.db.questions.findMany({
        where: whereQuery,
        include: {
          options: true,
          solution: true,
          subjects: { select: { name: true } },
          chapters: { 
            select: { name: true, isCbse: true, isJeeAdvanced: true, isJeeMain: true, chapterNumber: true } 
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
      const processedQuestions = await Promise.all(
        questionsRaw.map(async (q) => {
          const subjectName = q.subjects?.name || null;
          const chapterName = q.chapters?.name || null;
          const examName = q.papers?.exam?.name || null;
          const isCbse = q.chapters?.isCbse ?? false;
          const isJeeMain = q.chapters?.isJeeMain ?? false;
          const isJeeAdvanced = q.chapters?.isJeeAdvanced ?? false;

          const signedQuestionImages = await this.signUrlArray(q.image);
          const signedCompImages = await this.signUrlArray(q.comprehensionImage);

          let processedOptions = null;
          if (q.options) {
            processedOptions = {
              ...q.options,
              optionAimage: await this.signUrlArray(q.options.optionAimage),
              optionBimage: await this.signUrlArray(q.options.optionBimage),
              optionCimage: await this.signUrlArray(q.options.optionCimage),
              optionDimage: await this.signUrlArray(q.options.optionDimage),
            };
          }

          let processedSolution = null;
          if (q.solution) {
            processedSolution = {
              ...q.solution,
              image: await this.signUrlArray(q.solution.image),
            };
          }

          return {
            ...q,
            subject: subjectName,
            chapter: chapterName,
            exam: examName,
            paperTitle: q.papers?.year ? `${examName} ${q.papers.year}` : null,
            isCbse, isJeeMain, isJeeAdvanced,

            // Remove relations
            subjects: undefined, chapters: undefined, papers: undefined, 
            paperId: undefined, subjectId: undefined, chapterId: undefined,

            image: signedQuestionImages,
            comprehensionImage: signedCompImages,
            options: processedOptions,
            solution: processedSolution,
          };
        })
      );

      // 3. ENCRYPT EVERYTHING IN ONE GO
      // This returns a string like "iv:encrypted_blob"
      return encryptPayload(processedQuestions);

    } catch (err) {
      console.error("Error fetching questions:", err);
      throw err;
    }
  }

  // =================================================================
  // 4. GET QUESTIONS BY PAPER ID (RETURNS SINGLE ENCRYPTED STRING)
  // =================================================================
  async getQuestionsByPaperId(paperId: string) {
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
                select: { name: true, isCbse: true, isJeeAdvanced: true, isJeeMain: true } 
              }, 
            },
          },
        },
      });

      if (!paperRaw) return null;

      const processedQuestions = await Promise.all(
        paperRaw.questions.map(async (q) => {
          const subjectName = q.subjects?.name || null;
          const chapterName = q.chapters?.name || null;
          const isCbse = q.chapters?.isCbse ?? false;
          const isJeeMain = q.chapters?.isJeeMain ?? false;
          const isJeeAdvanced = q.chapters?.isJeeAdvanced ?? false;

          const signedQuestionImages = await this.signUrlArray(q.image);
          const signedCompImages = await this.signUrlArray(q.comprehensionImage);

          let processedOptions = null;
          if (q.options) {
            processedOptions = {
              ...q.options,
              optionAimage: await this.signUrlArray(q.options.optionAimage),
              optionBimage: await this.signUrlArray(q.options.optionBimage),
              optionCimage: await this.signUrlArray(q.options.optionCimage),
              optionDimage: await this.signUrlArray(q.options.optionDimage),
            };
          }

          let processedSolution = null;
          if (q.solution) {
            processedSolution = {
              ...q.solution,
              image: await this.signUrlArray(q.solution.image),
            };
          }

          return {
            ...q,
            subject: subjectName,
            chapter: chapterName,
            isCbse, isJeeMain, isJeeAdvanced,

            subjects: undefined, chapters: undefined, 
            paperId: undefined, subjectId: undefined, chapterId: undefined,

            image: signedQuestionImages,
            comprehensionImage: signedCompImages,
            options: processedOptions,
            solution: processedSolution,
          };
        })
      );

      const finalObject = {
        ...paperRaw,
        exam: paperRaw.exam?.name, 
        questions: processedQuestions,
      };

      // 3. ENCRYPT EVERYTHING IN ONE GO
      return encryptPayload(finalObject);

    } catch (error) {
      console.error("Error fetching paper questions:", error);
      throw error;
    }
  }
}

export const question = new Question(database);