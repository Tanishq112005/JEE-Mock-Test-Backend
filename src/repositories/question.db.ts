import { chapters, PrismaClient, SubjectName, questionType } from "@prisma/client";
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
  // Helper: Group and Sort Questions by Type
  // ---------------------------------------------------------
  private groupAndSortBySection(questions: any[]) {
    const sections = {
      MultiCorrect: [] as any[],
      SingleCorrect: [] as any[],
      Integer: [] as any[],
    };

    questions.forEach((q) => {
      // Mapping based on user requirements
      switch (q.type) {
        // MultiCorrect Section
        case "MultiCorrect":
        case "ComprehensionMultiCorrect":
        case questionType.MultiCorrect: 
        case questionType.ComprehensionMultiCorrect:
          sections.MultiCorrect.push(q);
          break;

        // SingleCorrect Section
        case "SingleCorrect":
        case "ComprehensionSingleCorrect":
        case questionType.SingleCorrect:
        case questionType.ComprehensionSingleCorrect:
          sections.SingleCorrect.push(q);
          break;

        // Integer Section
        case "Integer":
        case "ComprehensionInteger":
        case questionType.Integer:
        case questionType.ComprehensionInteger:
          sections.Integer.push(q);
          break;
        
        default:
          // Fallback if needed, or push to SingleCorrect by default
          // console.warn("Unknown question type:", q.type);
          break;
      }
    });

    // Sort each section by questionNumber
    const sorter = (a: any, b: any) => (a.questionNumber || 0) - (b.questionNumber || 0);
    
    sections.MultiCorrect.sort(sorter);
    sections.SingleCorrect.sort(sorter);
    sections.Integer.sort(sorter);

    return sections;
  }

  // ---------------------------------------------------------
  // 2. Add Single Question (SAVES PLAIN TEXT TO DB)
  // ---------------------------------------------------------
  async addingSingleQuestion(questionData: questionParameters, paperId: string, questionNumber: number) {
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
      const processedQuestions = await Promise.all(
        questionsRaw.map(async (q) => {
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
        })
      );

      // 3. ENCRYPT EVERYTHING IN ONE GO
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
                select: { name: true, isJeeAdvanced: true, isJeeMain: true }
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
        })
      );

      // 1. Group by Subject
      const physicsRaw = processedQuestions.filter((q: any) => q.subject === SubjectName.Physics || q.subject === "Physics");
      const chemistryRaw = processedQuestions.filter((q: any) => q.subject === SubjectName.Chemistry || q.subject === "Chemistry");
      const mathematicsRaw = processedQuestions.filter((q: any) => q.subject === SubjectName.Mathematics || q.subject === "Mathematics");

      // 2. Group by Type within Subject
      const finalObject = {
        ...paperRaw,
        exam: paperRaw.exam?.name,
        questions: undefined,
        Physics: this.groupAndSortBySection(physicsRaw),
        Chemistry: this.groupAndSortBySection(chemistryRaw),
        Mathematics: this.groupAndSortBySection(mathematicsRaw),
      };

      // 3. ENCRYPT
      return encryptPayload(finalObject);
    } catch (error) {
      console.error("Error fetching paper questions:", error);
      throw error;
    }
  }

  // =================================================================
  // 5. GET RAW QUESTIONS BY PAPER ID (UNENCRYPTED)
  // =================================================================
  async getRawQuestionsForPaper(paperId: string) {
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

      if (!paperRaw) return null;

      const processedQuestions = await Promise.all(
        paperRaw.questions.map(async (q) => {
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
        })
      );

      // 1. Group by Subject
      const physicsRaw = processedQuestions.filter((q: any) => q.subject === SubjectName.Physics || q.subject === "Physics");
      const chemistryRaw = processedQuestions.filter((q: any) => q.subject === SubjectName.Chemistry || q.subject === "Chemistry");
      const mathematicsRaw = processedQuestions.filter((q: any) => q.subject === SubjectName.Mathematics || q.subject === "Mathematics");

      // 2. Group by Type within Subject & Return
      return {
        paperDetails: {
          ...paperRaw,
          questions: undefined
        },
        Physics: this.groupAndSortBySection(physicsRaw),
        Chemistry: this.groupAndSortBySection(chemistryRaw),
        Mathematics: this.groupAndSortBySection(mathematicsRaw)
      };

    } catch (error) {
      console.error("Error fetching raw paper questions:", error);
      throw error;
    }
  }

}

export const question = new Question(database);