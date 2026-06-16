import { question } from "../repositories/question.db";
import { optionsStoring, questionParameters } from "../types/questions.types";
import { imageUpload } from "./imageService";
import { questionType } from "@prisma/client";
import { randomUUID } from "crypto";
import { searchEngine } from "../utils/similarity";
import { Subject } from "../utils/chapter";

class QuestionCreating {
  constructor() {}

  async htmlContentQuestions(payload: any): Promise<questionParameters> {
    let typeOfQuestion: string = payload.type;
    const positiveMarks: number = payload.marks; // Fixed typo internally
    const negativeMarks: number = payload.negMarks;

    const chapterGroup: string = payload.chapterGroup || "";
    const chapterName: string = payload.chapter;
    const subjectName: string = payload.subject;


    let subject: Subject;
    const normalizedSub = subjectName?.toLowerCase().trim();
    if (normalizedSub === "chemistry") subject = "Chemistry";
    else if (
      normalizedSub === "mathematics" ||
      normalizedSub === "maths" ||
      normalizedSub === "math"
    )
      subject = "Mathematics";
    else if (normalizedSub === "physics") subject = "Physics";
    else {
      throw new Error(`Invalid or missing subject: "${subjectName}"`);
    }

    if (payload.question.en.comprehension != null) {
      typeOfQuestion = "comprehension";
    }

    let questionFormat: questionType;
    if (typeOfQuestion === "mcq") {
      questionFormat =
        payload.question.en.comprehension != null
          ? questionType.ComprehensionSingleCorrect
          : questionType.SingleCorrect;
    } else if (typeOfQuestion === "mcqm") {
      questionFormat =
        payload.question.en.comprehension != null
          ? questionType.ComprehensionMultiCorrect
          : questionType.MultiCorrect;
    } else {
      questionFormat =
        payload.question.en.comprehension != null
          ? questionType.ComprehensionInteger
          : questionType.Integer;
    }

    const isBonus = payload.isBonus;
    const isOutOfSyllabus = payload.isOutOfSyllabus;
    const comprehensionEn = payload.question.en.comprehension;
    const contentEn = payload.question.en.content;
    const optionsEn = payload.question.en.options || [];
    const correctOptionsEn = payload.question.en.correct_options;
    const correctAnswerEn = payload.question.en.answer;
    const explanationEn = payload.question.en.explanation;
    const examName = payload.exam;
    const idOfquestion = randomUUID();

  
    // const searchQuery = `${subject} ${chapterName} ${chapterGroup}`;
    // const searchResults = await searchEngine.findChapter(searchQuery);

    let finalChapterName = chapterName;
   
   /* if (searchResults.length > 0) {
   finalChapterName = searchResults[0].name;
      console.log(
        `🔍 Mapped "${chapterName}" -> "${finalChapterName}" (Score: ${searchResults[0].score.toFixed(2)})`,
      );
    } else {
      console.warn(
        `⚠️ Could not map chapter: "${chapterName}". Using raw value.`,
      );
    }*/


 
    const questionResult = await imageUpload.imageConverstion({
      id: idOfquestion,
      content: contentEn,
      exam: examName,
      type: "question",
    });

    const contentHtml = questionResult.html;
    const questionImages = questionResult.imagePaths;


    const optionsPromises = optionsEn.map(async (opt: any, index: number) => {
      const idofoptions = randomUUID();
      const optionResult = await imageUpload.imageConverstion({
        id: `${idOfquestion}_${idofoptions}_${index}`,
        content: opt.content,
        exam: examName,
        type: "option",
      });

      return {
        identifier: opt.identifier,
        content: optionResult.html,
        image: optionResult.imagePaths,
      };
    });

    const optionsContent: optionsStoring[] = await Promise.all(optionsPromises);

    // Process Answers
    let answers: string[] = [];
    if (Array.isArray(correctOptionsEn)) answers = [...correctOptionsEn];
    if (correctAnswerEn) answers.push(correctAnswerEn);
    answers = answers.filter(
      (ans) => ans !== null && ans !== undefined && ans !== "",
    );

 
    const [compResult, expResult] = await Promise.all([
      comprehensionEn
        ? imageUpload.imageConverstion({
            id: idOfquestion,
            content: comprehensionEn,
            exam: examName,
            type: "comprehension",
          })
        : Promise.resolve({ html: "", imagePaths: [] }),

      explanationEn
        ? imageUpload.imageConverstion({
            id: idOfquestion,
            content: explanationEn,
            exam: examName,
            type: "explanation",
          })
        : Promise.resolve({ html: "", imagePaths: [] }),
    ]);

    console.log(`Processed: ${finalChapterName}`);


    return {
      id: idOfquestion,
      isBonus: isBonus,
      isOutOfSyllabus: isOutOfSyllabus,
      questionType: questionFormat,
      postiveMarks: positiveMarks, 
      negativeMarks: negativeMarks,
      subject: subject,
      question: contentHtml,
      questionImage: questionImages,
      comprehension: compResult.html,
      comprehensionImage: compResult.imagePaths,
      options: optionsContent,
      correctAnswer: answers,
      explation: expResult.html,
      explationImage: expResult.imagePaths,
      chapter: finalChapterName,
      chapterGroup: chapterGroup
    };
  }

  async uploadBulkQuestions(fullJsonData: any, paperId: string) {
    try {
      const results = fullJsonData.results;
      let totalProcessed = 0;
      let totalFailed = 0;
      let globalQuestionCounter = 1;

      await searchEngine.initialize();

      for (const subjectBlock of results) {
        const subjectName = subjectBlock._id;
        const questionsArray = subjectBlock.questions;
        console.log(
          `Processing Subject: ${subjectName} with ${questionsArray.length} questions.`,
        );

        for (const qData of questionsArray) {
          try {
            const formattedData = await this.htmlContentQuestions(qData);
            await question.addingSingleQuestion(
              formattedData,
              paperId,
              globalQuestionCounter,
            );
            console.log(
              `Uploaded Question #${globalQuestionCounter} - ${subjectName}`,
            );
            totalProcessed++;
          } catch (questionError) {
            // Log the error but don't crash the whole upload loop
            console.error(
              `❌ Failed to upload Question #${globalQuestionCounter} in ${subjectName}:`,
              questionError,
            );
            totalFailed++;
          } finally {
            globalQuestionCounter++;
          }
        }
      }

      return {
        success: true,
        message: `Successfully uploaded ${totalProcessed} questions. Failed: ${totalFailed}.`,
        count: totalProcessed,
        failedCount: totalFailed,
      };
    } catch (error) {
      console.error("Bulk Upload Process Failed Critically:", error);
      throw error;
    }
  }
}

export const questionService = new QuestionCreating();
