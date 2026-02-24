import { updatingTestDetailsProducer } from "../rabbitmq/producers/updateTestDetails-producer";
import { testStatus } from "../repositories/testStatus.db";
import { updatingDetails } from "../types/testStatus.types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { AttemptStatus } from "@prisma/client";
import {
  detailsFromFrontend,
  questionDetailsFromFrontend,
} from "../types/update.types";
import { testEvaluationProducer } from "../rabbitmq/producers/testEvalution-producer";
import { testEvaluation } from "../services/testEvaluationService";
import { reddisConfigForCaching } from "../lib/caching";
import {
  cachingDataTestUpperLayer,
  insideTestId,
} from "../types/caching.types";
import { reddisService } from "../services/reddisService";

class TestController {
  constructor() {}

  public createTestStatus = async (req: any, res: any) => {
    const { paperId } = req.body;
    const userId = req.user;

    try {
      const testStatusDetails = await testStatus.startNewTestSession(
        userId,
        paperId,
      );

      return res
        .status(200)
        .json(new ApiResponse("Test Details", testStatusDetails));
    } catch (err: any) {
      return res.status(500).json(new ApiError("Error in Creating Test", err));
    }
  };

  public gettingQuestionAndDetails = async (req: any, res: any) => {
    const { testStatusId, created_at } = req.query;
    const userId = req.user;

    try {
      const dbSessionData = await testStatus.getSessionData(
        testStatusId,
        userId,
      );

      if (!dbSessionData) {
        return res.status(404).json(new ApiError("Test session not found"));
      }

      const cachedUpdateData = await reddisService.getTestUpdateDataFromReddis(
        userId,
        testStatusId,
        String(created_at),
      );

      if (!cachedUpdateData) {
        console.log(
          `⚠️ Redis MISS for testId: ${testStatusId}, returning DB data`,
        );
        return res
          .status(200)
          .json(new ApiResponse("Your question + test result", dbSessionData));
      }

      console.log(
        `✅ Redis HIT for testId: ${testStatusId}, merging with DB questions`,
      );

      const redisAttemptMap = new Map<string, any>();
      (cachedUpdateData.questionStatus || []).forEach((q: any) => {
        redisAttemptMap.set(q.questionId, q);
      });

      const mergeRedisAttempts = (data: any): any => {
        if (Array.isArray(data)) {
          return data.map((q: any) => {
            const redisAttempt = redisAttemptMap.get(q.id);

            if (!redisAttempt) return q;

            return {
              ...q,
              attemptStatus: {
                userAnswer: redisAttempt.userAnswer ?? null,
                isVisited: redisAttempt.isVisited ?? false,
                markedForReview: redisAttempt.markedForReview ?? false,
                timeSpent: redisAttempt.timeSpent ?? 0,
                status: redisAttempt.status ?? AttemptStatus.notAnswered,
              },
            };
          });
        }

        if (data && typeof data === "object") {
          const merged: any = {};
          for (const key in data) {
            merged[key] = mergeRedisAttempts(data[key]);
          }
          return merged;
        }

        return data;
      };

      const mergedPayload = {
        session: {
          testId: testStatusId,
          timeLeft: cachedUpdateData.timeLeft ?? dbSessionData.session.timeLeft,
          activeSection:
            cachedUpdateData.activeSection ??
            dbSessionData.session.activeSection,
          activeQuestionId:
            cachedUpdateData.activeQuestionId ??
            dbSessionData.session.activeQuestionId,
          status: cachedUpdateData.state ?? dbSessionData.session.status,
          startTime: dbSessionData.session.startTime,
        },
        paper: dbSessionData.paper,
        Physics: mergeRedisAttempts(dbSessionData.Physics),
        Chemistry: mergeRedisAttempts(dbSessionData.Chemistry),
        Mathematics: mergeRedisAttempts(dbSessionData.Mathematics),
      };

      return res
        .status(200)
        .json(new ApiResponse("Your question + test result", mergedPayload));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in getting question details", err));
    }
  };

  public updatingTheDetails = async (req: any, res: any) => {
    const {
      testId,
      paperId,
      timeLeft,
      created_at,
      timeStamp,
      state,
      activeSection,
      activeQuestionId,
      questionsById,
    }: detailsFromFrontend = req.body;
    const userId = req.user;

    try {
      const questionStatusArray = Object.values(questionsById || {}).map(
        (q: questionDetailsFromFrontend) => ({
          isVisited: q.isVisited,
          markedForReview: q.markedForReview,
          questionId: q.questionId,
          userAnswer: q.userAnswer,
          timeSpent: q.timeSpentSeconds || 0,
          status:
            q.status === AttemptStatus.answered
              ? AttemptStatus.answered
              : AttemptStatus.notAnswered,
        }),
      );

      const details: updatingDetails = {
        testId,
        userId,
        paperId,
        timeLeft,
        activeQuestionId,
        activeSection,
        created_at,
        timeStamp,
        state,
        questionStatus: questionStatusArray,
      };

      await Promise.all([
        updatingTestDetailsProducer.updateData(details),
        reddisService.upsertTestUpdateData(
          userId,
          testId,
          String(created_at),
          details,
        ),
      ]);

      return res.status(200).json(new ApiResponse("Pushed in queue"));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in updating the details", err));
    }
  };

  public LastTestDetails = async (req: any, res: any) => {
    const { paperId } = req.query;
    const userId = req.user;

    try {
      const testStatusDetails = await testStatus.gettingAllTestDetails(
        userId,
        paperId,
      );

      let payload;
      if (testStatusDetails.length === 0) {
        payload = {};
      } else {
        payload = {
          status: testStatusDetails[0].status,
          created_at: testStatusDetails[0].created_at,
          testId: testStatusDetails[0].id,
        };
      }

      return res.status(200).json(new ApiResponse("Last Test Data", payload));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in getting Details", err));
    }
  };

  public submitTest = async (req: any, res: any) => {
    const {
      testId,
      paperId,
      timeLeft,
      created_at,
      timeStamp,
      state,
      activeSection,
      activeQuestionId,
      questionsById,
    }: detailsFromFrontend = req.body;
    const userId = req.user;

    try {
      const questionStatusArray = Object.values(questionsById || {}).map(
        (q: questionDetailsFromFrontend) => ({
          isVisited: q.isVisited,
          markedForReview: q.markedForReview,
          questionId: q.questionId,
          userAnswer: q.userAnswer,
          timeSpent: q.timeSpentSeconds || 0,
          status:
            q.status === AttemptStatus.answered
              ? AttemptStatus.answered
              : AttemptStatus.notAnswered,
        }),
      );

      const details: updatingDetails = {
        testId,
        userId,
        paperId,
        timeLeft,
        activeQuestionId,
        activeSection,
        created_at,
        timeStamp,
        state,
        questionStatus: questionStatusArray,
      };

      const testEvaluate = await testEvaluation.evaluation(details, userId);

      let gettingUserUpperLayer: cachingDataTestUpperLayer =
        await reddisConfigForCaching.gettingAnanlyticsData(
          `${userId}:testUpperLayer`,
        );

      if (!gettingUserUpperLayer) {
        gettingUserUpperLayer = { testId: [] };
      }

      const dataToInsert: insideTestId = {
        id: testId,
        created_at: String(created_at),
      };
      gettingUserUpperLayer.testId.push(dataToInsert);

      await Promise.all([
        reddisConfigForCaching.settingAnanlyticsData(
          `${userId}:testUpperLayer`,
          gettingUserUpperLayer,
        ),
        reddisConfigForCaching.settingAnanlyticsData(
          `${userId}:${testId}:${String(created_at)}`,
          testEvaluate,
        ),

        reddisService.deleteTestUpdateData(userId, testId),
      ]);

      const created_at_string = String(created_at);
      console.log("CONTROLLER created_at_string:", created_at_string);

      await testEvaluationProducer.evaluateTheData({
        testId,
        studentId: userId,
        created_at: created_at_string,
        report: testEvaluate,
      });

      return res
        .status(200)
        .json(new ApiResponse("Test submitted successfully", testEvaluate));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in submitting the test", err));
    }
  };
}

export const testController = new TestController();
