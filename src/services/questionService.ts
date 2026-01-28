import { question } from "../repositories/question.db";
import {
  optionsStoring,
  questionParameters,
} from "../types/questions.types";
import { imageUpload } from "./imageService";
import { questionType } from "@prisma/client";
import { randomUUID } from "crypto";
import { findBestChapter } from "./chapterNameService";
import { Subject } from "../utils/chapter";

class QuestionCreating {
  constructor() {}

  async htmlContentQuestions(payload: any): Promise<questionParameters> {
    

    let typeOfQuestion: string = payload.type;
    const postiveMarks: number = payload.marks;
    const negativeMarks: number = payload.negMarks;
    const chapterGroup: string = payload.chapterGroup;
    const chapterName: string = payload.chapter;
    const subjectName: string = payload.subject;

    let subject: Subject;
    if (subjectName === "chemistry") subject = "Chemistry";
    else if (subjectName === "mathematics") subject = "Mathematics";
    else subject = "Physics";

    if (payload.question.en.comprehension != null) {
      typeOfQuestion = "comprehension";
    }

    let questionFormat: questionType;
    if (typeOfQuestion === "mcq") {
      questionFormat = questionType.SingleCorrect;
      if (payload.question.en.comprehension != null) questionFormat = questionType.ComprehensionSingleCorrect;
    } else if (typeOfQuestion === "mcqm") {
      questionFormat = questionType.MultiCorrect;
      if (payload.question.en.comprehension != null) questionFormat = questionType.ComprehensionMultiCorrect;
    } else {
      questionFormat = questionType.Integer;
      if (payload.question.en.comprehension != null) questionFormat = questionType.ComprehensionInteger;
    }

    const isBonous = payload.isBonus;
    const isOutOfSyllabus = payload.isOutOfSyllabus;
    const comprehensionEn = payload.question.en.comprehension;
    const contentEn = payload.question.en.content;
    const optionsEn = payload.question.en.options;
    const correctOptionsEn = payload.question.en.correct_options;
    const correctAnswerEn = payload.question.en.answer;
    const explanationEn = payload.question.en.explanation;
    const examName = payload.exam;
    const idOfquestion = randomUUID();

    const chapter = await findBestChapter({
      chapter: chapterName,
      chapterGroup: chapterGroup,
      subject: subject,
    });

   
    const questionResult = await imageUpload.imageConverstion({
      id: idOfquestion,
      content: contentEn,
      exam: examName,
      type: "question",
    });

  
    const contentHtml = questionResult.html; 
    const questionImages = questionResult.imagePaths;


    let optionsContent: optionsStoring[] = [];
    for (let i = 0; i < optionsEn.length; i++) {
      const identifier = optionsEn[i].identifier;
      const optionsContentEn = optionsEn[i].content;
      const idofoptions = randomUUID();

      const optionResult = await imageUpload.imageConverstion({
        id: `${idOfquestion}_${idofoptions}_${i}`,
        content: optionsContentEn,
        exam: examName,
        type: "option",
      });

      optionsContent.push({
        identifier: identifier,
        content: optionResult.html, // DIRECT HTML
        image: optionResult.imagePaths,
      });
    }

    // --- 4. Process Answers ---
    let answers: string[] = [];
    if (Array.isArray(correctOptionsEn)) answers = [...correctOptionsEn];
    if (correctAnswerEn) answers.push(correctAnswerEn);
    answers = answers.filter((ans) => ans !== null && ans !== undefined && ans !== "");

    // --- 5. Process Comprehension (HTML ONLY) ---
    let comprehensionHtml = "";
    let comprehensionImages: string[] = [];

    if (comprehensionEn) {
      const compResult = await imageUpload.imageConverstion({
        id: idOfquestion,
        content: comprehensionEn,
        exam: examName,
        type: "comprehension",
      });
      comprehensionHtml = compResult.html; // DIRECT HTML
      comprehensionImages = compResult.imagePaths;
    }

    // --- 6. Process Explanation (HTML ONLY) ---
    let explationHtml = "";
    let explanationImages: string[] = [];

    if (explanationEn) {
      const expResult = await imageUpload.imageConverstion({
        id: idOfquestion,
        content: explanationEn,
        exam: examName,
        type: "explanation",
      });
      explationHtml = expResult.html; // DIRECT HTML
      explanationImages = expResult.imagePaths;
    }

    console.log(`Processed: ${chapter}`);

    // --- 7. Return Final Object ---
    return {
      id: idOfquestion,
      isBonus: isBonous,
      isOutOfSyllabus: isOutOfSyllabus,
      questionType: questionFormat,
      postiveMarks: postiveMarks,
      negativeMarks: negativeMarks,
      subject: subject,
      question: contentHtml, // Saving HTML
      questionImage: questionImages,
      comprehension: comprehensionHtml, // Saving HTML
      comprehensionImage: comprehensionImages,
      options: optionsContent,
      correctAnswer: answers,
      explation: explationHtml, // Saving HTML
      explationImage: explanationImages,
      chapter: chapter,
    };
  }

  async uploadBulkQuestions(fullJsonData: any, paperId: string) {
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
          await question.addingSingleQuestion(formattedData, paperId, globalQuestionCounter);
          console.log(`Uploaded Question #${globalQuestionCounter} - ${subjectName}`);
          globalQuestionCounter++;
          totalProcessed++;
        }
      }

      return {
        success: true,
        message: `Successfully uploaded ${totalProcessed} questions across ${results.length} subjects.`,
        count: totalProcessed,
      };
    } catch (error) {
      console.error("Bulk Upload Failed:", error);
      throw error;
    }
  }
}

export const questionService = new QuestionCreating();