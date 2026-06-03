import { updatingTestDetailsProducer } from "../rabbitmq/producers/updateTestDetails-producer";
import { testStatus } from "../repositories/testStatus.db";
import { updatingDetails } from "../types/testStatus.types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { AttemptStatus, ExamName } from "@prisma/client";
import {
  detailsFromFrontend,
  questionDetailsFromFrontend,
} from "../types/update.types";
import { testEvaluationProducer } from "../rabbitmq/producers/testEvalution-producer";
import { testEvaluation } from "../services/testEvaluationService";
import { cacheService } from "../lib/caching";
import {
  cachingDataTestUpperLayer,
  insideTestId,
} from "../types/caching.types";
import { dashboardCacheService } from "../services/dashboardCacheService";
import { paper } from "../repositories/paper.db";
import { encryptPayload } from "../utils/encryption";
class TestController {
  constructor() {}

  // ── Creating new test ────────────────────────────────────────────
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
        .json(new ApiResponse("Test Details", encryptPayload(testStatusDetails)));
    } catch (err: any) {
      return res.status(500).json(new ApiError("Error in Creating Test", err));
    }
  };

  // ── Getting questions + merging Redis cache on top ───────────────
  public gettingQuestionAndDetails = async (req: any, res: any) => {
    const { testStatusId, created_at } = req.query;
    const userId = req.user;
    const createdAtStr = String(created_at ?? "");

    try {
      if (!testStatusId) {
        return res.status(400).json(new ApiError("testStatusId is required"));
      }

      const dbSessionData = await testStatus.getSessionData(
        testStatusId,
        userId,
      );

      if (!dbSessionData) {
        return res.status(404).json(new ApiError("Test session not found"));
      }

      // ── Try Redis cache first ────────────────────────────────
      const cachedUpdateData =
        await dashboardCacheService.getTestUpdateDataFromReddis(
          userId,
          testStatusId,
          createdAtStr,
        );

      // ── Redis MISS — return pure DB data ─────────────────────
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

      // ── Build lookup map from Redis attempts ─────────────────
      const redisAttemptMap = new Map<string, any>();
      (cachedUpdateData.questionStatus || []).forEach((q: any) => {
        redisAttemptMap.set(q.questionId, q);
      });

      // ── Merge Redis attempts into DB question arrays ──────────
      const mergeSubject = (questions: any[]): any[] => {
        if (!Array.isArray(questions)) return questions;
        return questions.map((q: any) => {
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
        Physics: mergeSubject(dbSessionData.Physics),
        Chemistry: mergeSubject(dbSessionData.Chemistry),
        Mathematics: mergeSubject(dbSessionData.Mathematics),
      };

      return res
        .status(200)
        .json(new ApiResponse("Your question + test result", encryptPayload(mergedPayload)));
    } catch (err: any) {

      console.log(err) ; 
      return res
        .status(500)
        .json(new ApiError("Error in getting question details", err));
    }
  };

  // ── Saving in-progress update → queue + Redis ────────────────────
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
    const createdAtStr = String(created_at ?? "");

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

      // ── Push to queue AND cache in Redis in parallel ──────────
      await Promise.all([
        updatingTestDetailsProducer.updateData(details),
        dashboardCacheService.upsertTestUpdateData(
          userId,
          testId,
          createdAtStr,
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

  // ── Last test session of the user with the paper ─────────────────
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
        let latestStatus = testStatusDetails[0].status;

        // ── Verify against Redis in case it's still processing as COMPLETED ──
        if (latestStatus === "IN_PROGRESS" || latestStatus === "PAUSED") {
          try {
            const upperLayer = await cacheService.getCache(
              `${userId}:testUpperLayer`,
            );
            if (upperLayer && Array.isArray(upperLayer.testId)) {
              const isCompleted = upperLayer.testId.some(
                (t: any) => t.id === testStatusDetails[0].id,
              );
              if (isCompleted) {
                latestStatus = "COMPLETED";
              }
            }
          } catch (err) {
            console.error(
              "Error fetching redis upper layer in LastTestDetails:",
              err,
            );
          }
        }

        payload = {
          status: latestStatus,
          created_at: testStatusDetails[0].created_at,
          testId: testStatusDetails[0].id,
        };
      }

      return res.status(200).json(new ApiResponse("Last Test Data", encryptPayload(payload)));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in getting Details", err));
    }
  };

  // ── Submitting the test → evaluate + write analytics cache ───────
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
      const questionStatusArray = Object.values(questionsById || {}).map(
        (q: any) => {
          let formattedAnswer: string[] = [];

          if (
            q.numericAnswer !== null &&
            q.numericAnswer !== undefined &&
            q.numericAnswer !== ""
          ) {
            formattedAnswer.push(String(q.numericAnswer));
          } else if (
            Array.isArray(q.selectedOptionIds) &&
            q.selectedOptionIds.length > 0
          ) {
            formattedAnswer = q.selectedOptionIds.map(String);
          } else if (q.userAnswer !== null && q.userAnswer !== undefined) {
            formattedAnswer = Array.isArray(q.userAnswer)
              ? q.userAnswer.map(String)
              : [String(q.userAnswer)];
          }

          return {
            isVisited: q.isVisited,
            markedForReview: q.markedForReview,
            questionId: q.questionId,
            userAnswer: formattedAnswer,
            timeSpent: q.timeSpentSeconds || 0,
            status:
              q.status === AttemptStatus.answered
                ? AttemptStatus.answered
                : AttemptStatus.notAnswered,
          };
        },
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

      if (!testEvaluate) {
        return res
          .status(400)
          .json(new ApiError("Evaluation failed. Cannot submit test."));
      }

      let gettingUserUpperLayer: cachingDataTestUpperLayer =
        await cacheService.getCache(`${userId}:testUpperLayer`);

      if (
        !gettingUserUpperLayer ||
        !Array.isArray(gettingUserUpperLayer.testId)
      ) {
        gettingUserUpperLayer = { testId: [] };
      }

      const dataToInsert: insideTestId = {
        id: testId,
        created_at: created_at_string,
      };
      gettingUserUpperLayer.testId.push(dataToInsert);

      // ── Persist analytics + clean up in-progress cache ────────
      await Promise.all([
        cacheService.setCache(
          `${userId}:testUpperLayer`,
          gettingUserUpperLayer,
        ),
        cacheService.setCache(
          `${userId}:${testId}:${created_at_string}`,
          testEvaluate,
        ),
        dashboardCacheService.deleteTestUpdateData(userId, testId),
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
        .json(new ApiResponse("Test submitted successfully", encryptPayload(testEvaluate)));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in submitting the test", err));
    }
  };

  // getting the details of the last test session
  // ── Getting all papers for a year+exam with attempt status ──────────
  public getPapersWithStatus = async (req: any, res: any) => {
    const { examName, year } = req.query;
    const userId = req.user;

    try {
      if (!examName || !year) {
        return res
          .status(400)
          .json(new ApiError("examName and year are required"));
      }

      const parsedYear = parseInt(year as string, 10);
      if (isNaN(parsedYear)) {
        return res
          .status(400)
          .json(new ApiError("year must be a valid number"));
      }

      // ── Step 1: Get all papers for this exam + year ──────────────
      const papers = (await paper.gettingPaperInformation(
        parsedYear,
        examName as ExamName,
      )) as any[];

      if (!papers || papers.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse("No papers found for this exam and year", []));
      }

      const paperIds = papers.map((p: any) => p.id);

      // ── Step 2: Get all testStatus rows for this student + these papers ──
      // One query for all papers at once — no N+1
      const allTestSessions = await testStatus.gettingAllTestDetailsForPapers(
        userId,
        paperIds,
      );

      // ── Check Redis Analytics UpperLayer for recent test submissions ──
      let upperLayer: any = null;
      try {
        upperLayer = await cacheService.getCache(`${userId}:testUpperLayer`);
      } catch (err) {
        console.error("Error fetching redis upper layer:", err);
      }

      const completedTestIds = new Set(
        upperLayer && Array.isArray(upperLayer.testId)
          ? upperLayer.testId.map((t: any) => t.id)
          : [],
      );

      // ── Step 3: Group sessions by paperId ────────────────────────
      // A student may have multiple attempts on the same paper
      const sessionsByPaper: Record<string, any[]> = {};
      for (const session of allTestSessions) {
        // Override status if completed in Redis
        let currentStatus = session.status;
        if (
          (currentStatus === "IN_PROGRESS" || currentStatus === "PAUSED") &&
          completedTestIds.has(session.id)
        ) {
          currentStatus = "COMPLETED";
        }
        session.status = currentStatus;

        if (!sessionsByPaper[session.paperId]) {
          sessionsByPaper[session.paperId] = [];
        }
        sessionsByPaper[session.paperId].push(session);
      }

      // ── Step 4: Build response — one entry per paper ─────────────
      const result = papers.map((p: any) => {
        const sessions = sessionsByPaper[p.id] ?? [];

        // Sort sessions newest first
        sessions.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        const latestSession = sessions[0] ?? null;

        // Derive overall attempt status for this paper
        let attemptStatus: "not_attempted" | "in_progress" | "completed" =
          "not_attempted";
        if (latestSession) {
          if (latestSession.status === "COMPLETED") {
            attemptStatus = "completed";
          } else if (
            latestSession.status === "IN_PROGRESS" ||
            latestSession.status === "PAUSED"
          ) {
            attemptStatus = "in_progress";
          }
        }

        return {
          // ── Paper details ────────────────────────────────────
          paperId: p.id,
          examName: examName,
          year: p.year,
          month: p.month,
          day: p.day,
          date: p.date,
          shift: p.shift,
          mode: p.mode,
          totalMarks: p.totalMarks,
          totalDuration: p.totalDuration,
          totalQuestions: p.totalQuestions,

          // ── Attempt status ───────────────────────────────────
          attemptStatus,
          totalAttempts: sessions.length,

          // Latest attempt info (null if never attempted)
          latestAttempt: latestSession
            ? {
                testId: latestSession.id,
                status: latestSession.status,
                isAnalyzed: latestSession.isAnalyzed,
                createdAt: latestSession.created_at,
                timeLeft: latestSession.timeLeft,
              }
            : null,

          // All attempts (newest first)
          allAttempts: sessions.map((s: any) => ({
            testId: s.id,
            status: s.status,
            isAnalyzed: s.isAnalyzed,
            createdAt: s.created_at,
            timeLeft: s.timeLeft,
          })),
        };
      });

      return res
        .status(200)
        .json(new ApiResponse("Papers with attempt status", encryptPayload(result)));
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Error in getting papers with status", err));
    }
  };
}

export const testController = new TestController();
