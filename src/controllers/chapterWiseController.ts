import { cacheService } from "../lib/caching";
import { user } from "../repositories/user.db";
import {
  PracticeAttemptInput,
  practiceQuestionEvaluation,
} from "../services/questionEvalutionService";
import { questionBitmapRegistry } from "../services/uniqueCountService";
import {
  cachingDataPraticeUpperLayer,
  praticeWiseStatus,
} from "../types/caching.types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { chapterWiseCacheService } from "../services/chapterWiseCacheService";
import { updateChapterAttemptProducer } from "../rabbitmq/producers/updateChapterAttempt-producer";
import { submitChapterAttemptProducer } from "../rabbitmq/producers/submitChapterAttempt-producer";
import { AttemptStatus, SubjectName } from "@prisma/client";
import { chapter } from "../repositories/chapter.db";
import { chapterWisePractice } from "../repositories/chapterWisePractice.db";
class ChapterWiseController {
  constructor() {}

   // api for getting the group name 
   // need the subject name 
  public groupName = async (req: any, res: any) => {
    try {
      let { subjectName } = req.query;
      if (
        !subjectName ||
        !Object.values(SubjectName).includes(subjectName as SubjectName)
      ) {
        return res.status(400).json(new ApiError("Invalid subject name"));
      }

      const finalResponse = await chapter.gettingDetailedGroups(
        subjectName as string,
      );
      return res
        .status(200)
        .json(
          new ApiResponse(`Group Of the ${subjectName} are: `, finalResponse),
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in getting the group", err));
    }
  };

  // API to get chapters for a particular group
  public getChaptersByGroups = async (req: any, res: any) => {
    try {
      const { groupName } = req.query;
      if (!groupName) {
        return res.status(400).json(new ApiError("groupName is required"));
      }

      const chapters = await chapter.gettingChapter({ group: groupName as string });
      return res
        .status(200)
        .json(new ApiResponse(`Chapters for group ${groupName}`, chapters));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error fetching chapters by group", err as any));
    }
  };
  
  // api for the getting the chapter question 
  // and the problem text 
  // status of the problem 
  // need the chapterId 
  public getChapterInfo = async (req: any, res: any) => {
    try {
      const { chapterId } = req.params;
      const userId = req.user;

      if (!chapterId)
        return res.status(400).json(new ApiError("chapterId is required"));

      const stats = await chapterWisePractice.getChapterInfo(chapterId, userId);
      return res
        .status(200)
        .json(new ApiResponse("Chapter Stats fetched", stats));
    } catch (err) {
      return res
        .status(500)
        .json(new ApiError("Error fetching chapter stats", err as any));
    }
  };

  
  

  
  
  public getQuestionAttemptsHistory = async (req: any, res: any) => {
    try {
      const { questionId } = req.params;
      const userId = req.user;

      if (!questionId)
        return res.status(400).json(new ApiError("questionId is required"));

      const history = await chapterWisePractice.getQuestionAttemptsHistory(
        questionId,
        userId,
      );
      return res
        .status(200)
        .json(new ApiResponse("Question history fetched", history));
    } catch (err) {
      return res
        .status(500)
        .json(new ApiError("Error fetching question history", err as any));
    }
  };

  


  
  public updateTimeSpentStatus = async (req: any, res: any) => {
    try {
      const { questionId } = req.params;
      const userId = req.user;
      const { status, timeSpent, userAnswer } = req.body;

      const payload = {
        studentId: userId,
        questionId,
        status: status || AttemptStatus.notAnswered,
        timeSpent: timeSpent || 0,
        userAnswer: userAnswer || [],
      };

      // 1. Cache to Redis for immediate fast access
      await chapterWiseCacheService.upsertAttemptData(
        userId,
        questionId,
        payload,
      );

      // 2. Queue for Postgres persistence
      await updateChapterAttemptProducer.updateAttemptData(payload);

      return res
        .status(200)
        .json(
          new ApiResponse("Question progress updated continuously", payload),
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error updating progress continuously", err as any));
    }
  };


  public submitImmediateEvaluate = async (req: any, res: any) => {
    try {
      const { questionId } = req.params;
      const userId = req.user;
      const {
        status,
        timeSpent,
        userAnswerRaw, 
      } = req.body;

      const studentId = req.user ; 
      const result = await practiceQuestionEvaluation.evaluate({
        questionId: questionId,
        userAnswer: userAnswerRaw || [],
        timeSpent: timeSpent || 0,
        created_at: new Date()
      });
      
      const payload = {
        studentId: userId,
        questionId,
        status: status || AttemptStatus.answered,
        timeSpent: timeSpent || 0,
        userAnswer: userAnswerRaw || [],
        isCorrect: result.verdict === "correct",
        marksObtained: result.marks,
      };
      

      if(result.verdict === "correct"){
        await questionBitmapRegistry.markAttempted(studentId , questionId) ; 
      }
      // Set to Redis first so user can check immediate history
      await chapterWiseCacheService.upsertAttemptData(userId, questionId, payload);

      // Push to main submit queue which fully persists it and evaluated results
      await submitChapterAttemptProducer.submitAttemptData(payload);

      // We immediately send the evaluated result to the user
      return res.status(200).json(
        new ApiResponse("Question submitted and evaluated", {
          marksObtained: result.marks,
          verdict: result.verdict,
          isCorrect: result.verdict === "correct",
        }),
      );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error evaluating answer", err as any));
    }
  };
}

export const chapterWiseController = new ChapterWiseController();
