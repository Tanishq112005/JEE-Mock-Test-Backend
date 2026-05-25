import { cacheService } from "../lib/caching";
import { analytics } from "../repositories/analytics.db";
import { user } from "../repositories/user.db";
import {
  cachingDataTestUpperLayer,
} from "../types/caching.types";
import { TestEvaluationSummaryReport } from "../types/report.types";
import { updatingDetails } from "../types/testStatus.types";
import { chapterWiseCacheService } from "./chapterWiseCacheService";
import { testEvaluation } from "./testEvaluationService";
import { questionBitmapRegistry } from "./uniqueCountService";

class DashboardCacheService {
  constructor() {}

  // =================================================================
  // ANALYTICS — Test Data
  // =================================================================
  async reddisTestData(studentId: string) {
    try {
      const usersTestData: cachingDataTestUpperLayer =
        await cacheService.getCache(`${studentId}:testUpperLayer`);

      if (!usersTestData || !usersTestData.testId?.length) {
        return { testData: [] };
      }

      const userTestReddis = await Promise.all(
        usersTestData.testId.map(async (entry) => {
          const testData: TestEvaluationSummaryReport =
            await cacheService.getCache(
              `${studentId}:${entry.id}:${entry.created_at}`,
            );
          return {
            testId: entry.id,
            created_at: entry.created_at,
            testData,
          };
        }),
      );

      return {
        testData: userTestReddis.filter((t) => t.testData != null),
      };
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  }

  // =================================================================
  // ANALYTICS — Practice Wise Data
  // =================================================================
  async reddisPraticeWiseData(studentId: any) {
    try {
      const activeAttempts = await chapterWiseCacheService.getAllActiveAttempts(
        studentId,
      );

      const praticeWiseData = Object.entries(activeAttempts).flatMap(
        ([questionId, attempts]) =>
          attempts.map((attempt) => ({
            questionId,
            created_at: attempt.timestamp
              ? new Date(attempt.timestamp)
              : new Date(),
            questionData: {
              ...attempt,
              questionId: attempt.questionId ?? questionId,
              marks: attempt.marks ?? attempt.marksObtained ?? 0,
              positiveMarks: attempt.positiveMarks ?? 0,
              timeSpent: attempt.timeSpent ?? 0,
              type: attempt.type ?? attempt.questionType,
              examName: attempt.examName ?? attempt.exam ?? null,
              chapterId: attempt.chapterId ?? null,
            },
          })),
      );

      return { praticeWiseData };
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  }

  // =================================================================
  // UPDATE DATA — Read all update entries for a student
  // =================================================================
  async reddisTestUpdateData(studentId: any) {
    try {
      const userTestUpdateData: cachingDataTestUpperLayer =
        await cacheService.getCache(`${studentId}:updateUpperLayer`);

      if (!userTestUpdateData || !userTestUpdateData.testId?.length) {
        return { updateData: [] };
      }

      const testUpdateData: any = await Promise.all(
        userTestUpdateData.testId.map(async (entry: any) => {
          const updateData: updatingDetails = await cacheService.getCache(
            `${studentId}:${entry.id}:${entry.created_at}:updateData`,
          );
          return {
            testId: entry.id,
            created_at: entry.created_at,
            updateData,
          };
        }),
      );

      return {
        updateData: testUpdateData.filter((t: any) => t.updateData != null),
      };
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  }

  // =================================================================
  // UPDATE DATA — Get single test update entry
  // =================================================================
  async getTestUpdateDataFromReddis(
    studentId: string,
    testId: string,
    created_at: string,
  ): Promise<updatingDetails | null> {
    try {
      const updateData: updatingDetails = await cacheService.getCache(
        `${studentId}:${testId}:${created_at}:updateData`,
      );
      return updateData ?? null;
    } catch (err: any) {
      console.error("Redis getTestUpdateDataFromReddis failed:", err);
      return null;
    }
  }

  // =================================================================
  // UPDATE DATA — Upsert (always one entry per testId, no duplicates)
  // =================================================================
  async upsertTestUpdateData(
    studentId: string,
    testId: string,
    created_at: string,
    updateData: updatingDetails,
  ) {
    try {
      // ── 1. Get current upper layer index ──────────────────────
      let upperLayer: cachingDataTestUpperLayer = await cacheService.getCache(
        `${studentId}:updateUpperLayer`,
      );

      if (!upperLayer) {
        upperLayer = { testId: [] };
      }

      // ── 2. Check if this testId already exists ────────────────
      const existingEntry = upperLayer.testId.find(
        (entry: any) => entry.id === testId,
      );

      if (existingEntry) {
        // Delete the stale data key with the OLD timestamp
        await cacheService.deleteCache(
          `${studentId}:${testId}:${existingEntry.created_at}:updateData`,
        );
        console.log(
          `Deleted stale Redis key for testId: ${testId} | old timestamp: ${existingEntry.created_at}`,
        );
      }

      // ── 3. Remove old index entry ─────────────────────────────
      upperLayer.testId = upperLayer.testId.filter(
        (entry: any) => entry.id !== testId,
      );

      // ── 4. Push latest entry into index ───────────────────────
      upperLayer.testId.push({ id: testId, created_at });

      // ── 5. Persist both in parallel ───────────────────────────
      await Promise.all([
        cacheService.setCache(
          `${studentId}:${testId}:${created_at}:updateData`,
          updateData,
        ),
        cacheService.setCache(`${studentId}:updateUpperLayer`, upperLayer),
      ]);

      console.log(
        `Redis upserted updateData for testId: ${testId} | timestamp: ${created_at}`,
      );
    } catch (err: any) {
      // ── Never let Redis failure break the main flow ───────────
      console.error("Redis upsertTestUpdateData failed:", err);
    }
  }

  // =================================================================
  // UPDATE DATA — Delete a test's update entry (call after DB confirms write)
  // =================================================================
  async deleteTestUpdateData(studentId: string, testId: string) {
    try {
      // ── 1. Get upper layer to find the timestamp ──────────────
      const upperLayer: cachingDataTestUpperLayer = await cacheService.getCache(
        `${studentId}:updateUpperLayer`,
      );

      if (!upperLayer || !upperLayer.testId?.length) return;

      const existingEntry = upperLayer.testId.find(
        (entry: any) => entry.id === testId,
      );

      if (!existingEntry) {
        console.log(`No Redis entry found to delete for testId: ${testId}`);
        return;
      }

      // ── 2. Delete the data key ────────────────────────────────
      await cacheService.deleteCache(
        `${studentId}:${testId}:${existingEntry.created_at}:updateData`,
      );

      // ── 3. Remove from index and persist ─────────────────────
      upperLayer.testId = upperLayer.testId.filter(
        (entry: any) => entry.id !== testId,
      );

      await cacheService.setCache(`${studentId}:updateUpperLayer`, upperLayer);

      console.log(`Redis fully removed updateData for testId: ${testId}`);
    } catch (err: any) {
      console.error("Redis deleteTestUpdateData failed:", err);
    }
  }
}

export const dashboardCacheService = new DashboardCacheService();
