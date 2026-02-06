import { question } from "../repositories/question.db";
import { optionsStoring, questionParameters } from "../types/questions.types";
import { imageUpload } from "./imageService";
import { questionType } from "@prisma/client";
import { randomUUID } from "crypto";
import { searchEngine } from "../utils/similarity"; // <-- ADDED: Your new Hybrid Engine
import { Subject } from "../utils/chapter";

class QuestionCreating {
  constructor() {}

  async htmlContentQuestions(payload: any): Promise<questionParameters> {
    
    let typeOfQuestion: string = payload.type;
    const postiveMarks: number = payload.marks;
    const negativeMarks: number = payload.negMarks;
    
    // Raw inputs from the file/payload
    const chapterGroup: string = payload.chapterGroup || ""; 
    const chapterName: string = payload.chapter;
    const subjectName: string = payload.subject;

    // Normalize Subject
    let subject: Subject;
    if (subjectName.toLowerCase() === "chemistry") subject = "Chemistry";
    else if (subjectName.toLowerCase() === "mathematics") subject = "Mathematics";
    else subject = "Physics";

    // ... (Question Type Logic remains the same) ...
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

    // =========================================================
    // 🧠 INTELLIGENT CHAPTER MAPPING (Hybrid Search)
    // =========================================================
    
    // 1. Construct a rich query string
    // e.g. "Chemistry Thermodynamics Physical Chemistry"
    const searchQuery = `${subject} ${chapterName} ${chapterGroup}`;

    // 2. Ask the Search Engine
    // It uses Vector Similarity (Meaning) + Keyword Matching (Precision)
    const searchResults = await searchEngine.findChapter(searchQuery);

    let finalChapterName = chapterName; // Default fallback

    if (searchResults.length > 0) {
        // We take the top result. 
        // You can use .slug if you want the ID, or .name for the official title.
        finalChapterName = searchResults[0].name; 
        
        // Optional: Log confidence to verify it's working
        console.log(`🔍 Mapped "${chapterName}" -> "${finalChapterName}" (Score: ${searchResults[0].score.toFixed(2)})`);
    } else {
        console.warn(`⚠️ Could not map chapter: "${chapterName}". Using raw value.`);
    }

    // =========================================================

    // ... (Image Processing logic remains the same) ...
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
        content: optionResult.html, 
        image: optionResult.imagePaths,
      });
    }

    // --- 4. Process Answers ---
    let answers: string[] = [];
    if (Array.isArray(correctOptionsEn)) answers = [...correctOptionsEn];
    if (correctAnswerEn) answers.push(correctAnswerEn);
    answers = answers.filter((ans) => ans !== null && ans !== undefined && ans !== "");

    // --- 5. Process Comprehension ---
    let comprehensionHtml = "";
    let comprehensionImages: string[] = [];

    if (comprehensionEn) {
      const compResult = await imageUpload.imageConverstion({
        id: idOfquestion,
        content: comprehensionEn,
        exam: examName,
        type: "comprehension",
      });
      comprehensionHtml = compResult.html; 
      comprehensionImages = compResult.imagePaths;
    }

    // --- 6. Process Explanation ---
    let explationHtml = "";
    let explanationImages: string[] = [];

    if (explanationEn) {
      const expResult = await imageUpload.imageConverstion({
        id: idOfquestion,
        content: explanationEn,
        exam: examName,
        type: "explanation",
      });
      explationHtml = expResult.html; 
      explanationImages = expResult.imagePaths;
    }

    console.log(`Processed: ${finalChapterName}`);

    // --- 7. Return Final Object ---
    return {
      id: idOfquestion,
      isBonus: isBonous,
      isOutOfSyllabus: isOutOfSyllabus,
      questionType: questionFormat,
      postiveMarks: postiveMarks,
      negativeMarks: negativeMarks,
      subject: subject,
      question: contentHtml, 
      questionImage: questionImages,
      comprehension: comprehensionHtml, 
      comprehensionImage: comprehensionImages,
      options: optionsContent,
      correctAnswer: answers,
      explation: explationHtml, 
      explationImage: explanationImages,
      chapter: finalChapterName, // Using the AI-matched name
    };
  }

  async uploadBulkQuestions(fullJsonData: any, paperId: string) {
    try {
      const results = fullJsonData.results;
      let totalProcessed = 0;
      let globalQuestionCounter = 1;

      // Ensure Search Engine is ready before starting a bulk upload
      // (It usually inits in server.ts, but this is a safety check)
      await searchEngine.initialize(); 

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