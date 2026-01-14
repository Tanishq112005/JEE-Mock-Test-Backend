
import { markdown } from "../utils/markdown";
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
  constructor() { }

  async htmlContentQuestions(
    payload: any
  ): Promise<questionParameters> {
    let typeOfQuestion: string = payload.type;
    const postiveMarks: number = payload.marks;
    const negativeMarks: number = payload.negMarks;
    const chapterGroup: string = payload.chapterGroup;
    const chapterName: string = payload.chapter;
    const subjectName: string = payload.subject;
    let subject : Subject ; 
    if(subjectName == 'chemistry') {
       subject = 'Chemistry' ; 
    }
    else if(subjectName == 'mathematics'){
      subject = 'Mathematics' ;
    }
    else {
      subject = 'Physics' ; 
    }
    if (payload.question.en.comprehension != null) {
      typeOfQuestion = "comprehension";
    }
    let questionFormat: questionType;
    if (typeOfQuestion === 'mcq') {
      questionFormat = questionType.SingleCorrect;
    }
    else if (typeOfQuestion === 'mcqm') {
      questionFormat = questionType.MultiCorrect;
    }
    else if (typeOfQuestion === 'integer') {
      questionFormat = questionType.Integer;
    }
    else {
      questionFormat = questionType.Comprehension;
    }

    const isBonous: boolean = payload.isBonus;
    const isOutOfSyllabus: boolean = payload.isOutOfSyllabus;
    const comprehensionEn: any = payload.question.en.comprehension;
    const contentEn: string = payload.question.en.content;
    const optionsEn = payload.question.en.options;
    const correctOptionsEn = payload.question.en.correct_options;
    const correctAnswerEn = payload.question.en.answer;
    const explanationEn = payload.question.en.explanation;
    const paperTitle = payload.paperTitle;
    const examName: string = payload.exam;
    const idOfquestion =  randomUUID() ; 
    const chapter  = await findBestChapter({chapter : chapterName ,
    chapterGroup : chapterGroup ,
    subject : subject}           
    ) ;
    const examYear = payload.year;

    // step1: image uploading in the database
    const imageName: string[] = await imageUpload.imageConverstion({
      id : idOfquestion , 
      content: contentEn,
      exam: examName,
      type : 'question'
    });

    // step2 : converting the text into the markup language
    const contentMarkup = markdown.convertor(contentEn);


    let optionsContent: optionsStoring[] = [];
    for (let i = 0; i < optionsEn.length; i++) {
      // selecting the identifier
      const identifier = optionsEn[i].identifier;
      const optionsContentEn: string = optionsEn[i].content;
      const idofoptions = randomUUID() ; 
      // collecting the images names
      const imageNameOptions: string[] = await imageUpload.imageConverstion({
       
        id : `${idOfquestion + '_' + idofoptions + '_' + i} ` , 
        content: optionsContentEn,
        exam: examName,
        type : 'option'
      });

      // converting the text into the markup
      const optionContentMarkup = markdown.convertor(optionsContentEn);
      optionsContent.push({
        identifier: identifier,
        content: optionContentMarkup,
        image: imageNameOptions,
      });
    }

    // step4 :  storing the answer
    let answers: string[] = [];

    // 1. Add correct_options (e.g. ["B"]) if it exists
    if (Array.isArray(correctOptionsEn)) {
        answers = [...correctOptionsEn];
    }

    // 2. Add answer (e.g. "5" or null) ONLY if it is truthy
    if (correctAnswerEn) {
        answers.push(correctAnswerEn);
    }

    // 3. SAFETY FILTER: Remove any remaining null/undefined values just in case
    answers = answers.filter(ans => ans !== null && ans !== undefined && ans !== "");

    // step5 : if the problem is compresehison

    let imageNameComprehison: string[] = [];
    let comprehensionMarkup: string = "";

    // ONLY process if comprehensionEn is NOT null
    if (comprehensionEn) {
      // a. image formation
      imageNameComprehison = await imageUpload.imageConverstion({
        id : idOfquestion,
        content: comprehensionEn,
        exam: examName,
        type:'comprehension'
      });

      // b. comprehension in the markup
      comprehensionMarkup = markdown.convertor(comprehensionEn);
    }

    // step6: explanation
    let explanationImageNames: string[] = [];
    let explationContentMarkup: string = "";

    // ONLY process if explanationEn is NOT null
    if (explanationEn) {
      // a. imageProcessing
      explanationImageNames = await imageUpload.imageConverstion({
        id : idOfquestion ,
        content: explanationEn,
        exam: examName,
        type : 'explanation'
      });

      // b. markdown language
      explationContentMarkup = markdown.convertor(explanationEn);
    }
   console.log(chapter) ; 
    return {
      id : idOfquestion,
      isBonus: isBonous,
      isOutOfSyllabus: isOutOfSyllabus,
      questionType: questionFormat,
      postiveMarks: postiveMarks,
      negativeMarks: negativeMarks,
      subject: subject,
      question: contentMarkup,
      questionImage: imageName,
      comprehension: comprehensionMarkup,
      comprehensionImage: imageNameComprehison,
      options: optionsContent,
      correctAnswer: answers,
      explation: explationContentMarkup,
      explationImage: explanationImageNames,
      chapter: chapter
    };
  }


  async uploadBulkQuestions(fullJsonData: any , paperId : string) {
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

          await question.addingSingleQuestion(formattedData , paperId);

          console.log(`Uploaded Question #${globalQuestionCounter} - ${subjectName}`);

          globalQuestionCounter++;
          totalProcessed++;
        }
      }

      return {
        success: true,
        message: `Successfully uploaded ${totalProcessed} questions across ${results.length} subjects.`,
        count: totalProcessed
      };

    } catch (error) {
      console.error("Bulk Upload Failed:", error);
      throw error;
    }
  }

  



}

export const questionService = new QuestionCreating();
