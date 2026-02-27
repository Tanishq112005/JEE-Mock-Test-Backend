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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build the questionStatusArray from questionsById (used in 2 routes)
// ─────────────────────────────────────────────────────────────────────────────
function buildQuestionStatusArray(questionsById: questionDetailsFromFrontend[]) {
  return (questionsById || []).map((q: questionDetailsFromFrontend) => ({
    isVisited: q.isVisited,
    markedForReview: q.markedForReview,
    questionId: q.questionId,
    userAnswer: q.userAnswer,
    timeSpent: q.timeSpentSeconds || 0,
    status:
      q.status === AttemptStatus.answered
        ? AttemptStatus.answered
        : AttemptStatus.notAnswered,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: merge Redis attempt data into a flat array of question objects
// Instead of a risky deep-recursive approach, we handle each subject directly
// ─────────────────────────────────────────────────────────────────────────────
function mergeSubjectWithRedis(
  subjectQuestions: any[],
  redisAttemptMap: Map<string, any>
): any[] {
  if (!Array.isArray(subjectQuestions)) return subjectQuestions;

  return subjectQuestions.map((q: any) => {
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

  // ───────────────────────────────────────────────────────────────────────────
  // GET — fetch question data, merging Redis cache on top of DB baseline
  // ───────────────────────────────────────────────────────────────────────────
  public gettingQuestionAndDetails = async (req: any, res: any) => {
    const { testStatusId, created_at } = req.query;
    const userId = req.user;

    // Normalise created_at to string immediately (protects Redis key consistency)
    const createdAtStr = String(created_at ?? "");

    if (!testStatusId) {
      return res.status(400).json(new ApiError("testStatusId is required"));
    }

    try {
      // 1. Always pull the DB baseline (questions, paper structure, session meta)
      const dbSessionData = await testStatus.getSessionData(testStatusId, userId);

      if (!dbSessionData) {
        return res.status(404).json(new ApiError("Test session not found"));
      }

      // 2. Try to pull the latest in-progress state from Redis
      const cachedUpdateData = await reddisService.getTestUpdateDataFromReddis(
        userId,
        testStatusId,
        createdAtStr,
      );

      // 3. Redis MISS → return pure DB data
      if (!cachedUpdateData) {
        console.log(`⚠️ Redis MISS for testId: ${testStatusId}, returning DB data`);
        return res
          .status(200)
          .json(new ApiResponse("Your question + test result", dbSessionData));
      }

      console.log(`✅ Redis HIT for testId: ${testStatusId}, merging with DB questions`);

      // 4. Build a lookup map from Redis attempt data  { questionId → attempt }
      const redisAttemptMap = new Map<string, any>();
      (cachedUpdateData.questionStatus || []).forEach((q: any) => {
        redisAttemptMap.set(q.questionId, q);
      });

      // 5. Merge Redis attempts into each subject array from DB
      //    (flat per-subject merge — no risky deep recursion)
      const mergedPayload = {
        session: {
          testId: testStatusId,
          timeLeft: cachedUpdateData.timeLeft ?? dbSessionData.session.timeLeft,
          activeSection:
            cachedUpdateData.activeSection ?? dbSessionData.session.activeSection,
          activeQuestionId:
            cachedUpdateData.activeQuestionId ?? dbSessionData.session.activeQuestionId,
          status: cachedUpdateData.state ?? dbSessionData.session.status,
          startTime: dbSessionData.session.startTime,
        },
        paper: dbSessionData.paper,
        Physics: mergeSubjectWithRedis(dbSessionData.Physics, redisAttemptMap),
        Chemistry: mergeSubjectWithRedis(dbSessionData.Chemistry, redisAttemptMap),
        Mathematics: mergeSubjectWithRedis(dbSessionData.Mathematics, redisAttemptMap),
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

  // ───────────────────────────────────────────────────────────────────────────
  // POST — save in-progress updates to RabbitMQ queue AND Redis cache
  // ───────────────────────────────────────────────────────────────────────────
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

    // ── Normalise created_at to string here (single source of truth) ──────────
    const createdAtStr = String(created_at ?? "");

    try {
      const questionStatusArray = buildQuestionStatusArray(questionsById);

      const details: updatingDetails = {
        testId,
        userId,
        paperId,
        timeLeft,
        activeQuestionId,
        activeSection,
        created_at,        // keep original type for DB/queue compatibility
        timeStamp,
        state,
        questionStatus: questionStatusArray,
      };

      // ── Fire-and-forget: queue write + Redis cache write in parallel ────────
      await Promise.all([
        updatingTestDetailsProducer.updateData(details),
        // Pass normalised string so Redis key always matches what the GET reads
        reddisService.upsertTestUpdateData(userId, testId, createdAtStr, details),
      ]);

      return res.status(200).json(new ApiResponse("Pushed in queue"));
    } catch (err: any) {
      console.error(err) ;
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

  // ───────────────────────────────────────────────────────────────────────────
  // POST — submit final test, evaluate, write analytics cache, clean update cache
  // ───────────────────────────────────────────────────────────────────────────
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

    const created_at_string = String(created_at ?? "");

    try {
      const questionStatusArray = buildQuestionStatusArray(questionsById);

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
        created_at: created_at_string,
      };
      gettingUserUpperLayer.testId.push(dataToInsert);

      // ── Persist analytics cache + clean up the in-progress update cache ─────
      await Promise.all([
        reddisConfigForCaching.settingAnanlyticsData(
          `${userId}:testUpperLayer`,
          gettingUserUpperLayer,
        ),
        reddisConfigForCaching.settingAnanlyticsData(
          `${userId}:${testId}:${created_at_string}`,
          testEvaluate,
        ),
        // Remove the in-progress update data now that the test is submitted
        reddisService.deleteTestUpdateData(userId, testId),
      ]);

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