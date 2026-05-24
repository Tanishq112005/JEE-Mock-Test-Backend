import { cacheService } from "../lib/caching";
import {
  PracticeAttemptInput,
  practiceQuestionEvaluation,
} from "../services/questionEvalutionService";
import { questionBitmapRegistry } from "../services/uniqueCountService";
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
  
  public getChapterInfo = async (req: any, res: any) => {
    try {
      const { chapterName } = req.params;
      const userId = req.user;

      if (!chapterName)
        return res.status(400).json(new ApiError("ChapterName is required"));

      let chapterRecord: any;
      try {
        chapterRecord = await chapter.gettingChapterId(chapterName);
      } catch (err: any) {
        return res
          .status(404)
          .json(new ApiError(`Chapter "${chapterName}" not found. Verify the chapter name.`, err));
      }

      const stats = await chapterWisePractice.getChapterInfo(
        chapterRecord.id,
        userId,
      );

      return res.status(200).json(
        new ApiResponse("Chapter Stats fetched", {
          chapterId: chapterRecord.id,
          chapterName: chapterRecord.name,
          ...stats,
        }),
      );
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
      const { status, timeSpent, userAnswer, userAnswerRaw, numericAnswer, selectedOptionIds } = req.body;

      let formattedAnswer: string[] = [];
      if (numericAnswer !== null && numericAnswer !== undefined && numericAnswer !== "") {
        formattedAnswer.push(String(numericAnswer));
      } else if (Array.isArray(selectedOptionIds) && selectedOptionIds.length > 0) {
        formattedAnswer = selectedOptionIds.map(String);
      } else if (userAnswer !== null && userAnswer !== undefined) {
        formattedAnswer = Array.isArray(userAnswer) ? userAnswer.map(String) : [String(userAnswer)];
      } else if (userAnswerRaw !== null && userAnswerRaw !== undefined) {
        formattedAnswer = Array.isArray(userAnswerRaw) ? userAnswerRaw.map(String) : [String(userAnswerRaw)];
      }

      const payload = {
        studentId: userId,
        questionId,
        status: status || AttemptStatus.notAnswered,
        timeSpent: timeSpent || 0,
        userAnswer: formattedAnswer,
      };

      await chapterWiseCacheService.upsertAttemptData(
        userId,
        questionId,
        payload,
      );

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
      const { status, timeSpent, userAnswerRaw, numericAnswer, selectedOptionIds, userAnswer } = req.body;
      const studentId = req.user; 

      let formattedAnswer: string[] = [];
      if (numericAnswer !== null && numericAnswer !== undefined && numericAnswer !== "") {
        formattedAnswer.push(String(numericAnswer));
      } else if (Array.isArray(selectedOptionIds) && selectedOptionIds.length > 0) {
        formattedAnswer = selectedOptionIds.map(String);
      } else if (userAnswer !== null && userAnswer !== undefined) {
        formattedAnswer = Array.isArray(userAnswer) ? userAnswer.map(String) : [String(userAnswer)];
      } else if (userAnswerRaw !== null && userAnswerRaw !== undefined) {
        formattedAnswer = Array.isArray(userAnswerRaw) ? userAnswerRaw.map(String) : [String(userAnswerRaw)];
      }

      const result = await practiceQuestionEvaluation.evaluate({
        questionId: questionId,
        userAnswer: formattedAnswer,
        timeSpent: timeSpent || 0,
        created_at: new Date()
      });
      

      const isActuallyCorrect = result.verdict && String(result.verdict).toLowerCase() === "correct";
      
      console.log(`[Submit] Evaluated Question ${questionId}. Verdict: "${result.verdict}". Parsed as Correct: ${isActuallyCorrect}`);

      console.log(isActuallyCorrect) ; 
      if (isActuallyCorrect) {
        console.log(`[Submit] Marking question as attempted in Redis Bitmap...`);
        const f = await questionBitmapRegistry.markAttempted(studentId, questionId); 
        console.log(f) ; 
        console.log(`[Submit] Successfully marked in Redis Bitmap.`);
      }
      
      

      const payload = {
        studentId: userId,
        questionId,
        status: status || AttemptStatus.answered,
        timeSpent: timeSpent || 0,
        userAnswer: formattedAnswer,
        isCorrect: isActuallyCorrect, // Use the safe boolean
        marksObtained: result.marks,
        verdict: result.verdict,
        positiveMarks: result.positiveMarks,
        negativeMarks: result.negativeMarks,
        type: result.type,
        subjectId: result.subjectId,
        chapterId: result.chapterId,
        examName: result.examName,
      };

      await chapterWiseCacheService.upsertAttemptData(userId, questionId, payload);
      await submitChapterAttemptProducer.submitAttemptData(payload);
     

      return res.status(200).json(
        new ApiResponse("Question submitted and evaluated", {
          marksObtained: result.marks,
          verdict: result.verdict,
          isCorrect: isActuallyCorrect,
        }),
      );
    } catch (err: any) {
      console.error("[Submit] Evaluation Error:", err);
      return res.status(500).json(new ApiError("Error evaluating answer", err as any));
    }
  };
}

export const chapterWiseController = new ChapterWiseController();
