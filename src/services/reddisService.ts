import { reddisConfigForCaching } from "../lib/caching";
import { analytics } from "../repositories/analytics.db";
import { user } from "../repositories/user.db";
import { cachingDataPraticeUpperLayer, cachingDataTestUpperLayer } from "../types/caching.types";
import { TestEvaluationSummaryReport } from "../types/report.types";
import { updatingDetails } from "../types/testStatus.types";
import { testEvaluation } from "./testEvaluationService";
import { questionBitmapRegistry } from "./uniqueCountService";

class ReddisService {

    constructor() {}

    // =================================================================
    // ANALYTICS — Test Data
    // =================================================================
    async reddisTestData(studentId: string) {
        try {
            const usersTestData: cachingDataTestUpperLayer =
                await reddisConfigForCaching.gettingAnanlyticsData(`${studentId}:testUpperLayer`);

            if (!usersTestData || !usersTestData.testId?.length) {
                return { testData: [] };
            }

            const userTestReddis = await Promise.all(
                usersTestData.testId.map(async (entry) => {
                    const testData: TestEvaluationSummaryReport =
                        await reddisConfigForCaching.gettingAnanlyticsData(
                            `${studentId}:${entry.id}:${entry.created_at}`
                        );
                    return {
                        testId:     entry.id,
                        created_at: entry.created_at,
                        testData,
                    };
                })
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
            const userPraticeWiseData: cachingDataPraticeUpperLayer =
                await reddisConfigForCaching.gettingAnanlyticsData(`${studentId}:praticeUpperLayer`);

            if (!userPraticeWiseData || !userPraticeWiseData.praticeStatus?.length) {
                return { praticeWiseData: [] };
            }

            const userPraticeWiseReddis = await Promise.all(
                userPraticeWiseData.praticeStatus.map(async (entry) => {
                    const questionData =
                        await reddisConfigForCaching.gettingAnanlyticsData(
                            `${studentId}:${entry.questionId}:${entry.created_at}`
                        );
                    return {
                        questionId:   entry.questionId,
                        created_at:   entry.created_at,
                        questionData,
                    };
                })
            );

            return {
                praticeWiseData: userPraticeWiseReddis.filter((q) => q.questionData != null),
            };

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
                await reddisConfigForCaching.gettingTestData(`${studentId}:updateUpperLayer`);

            if (!userTestUpdateData || !userTestUpdateData.testId?.length) {
                return { updateData: [] };
            }

            const testUpdateData: any = await Promise.all(
                userTestUpdateData.testId.map(async (entry: any) => {
                    const updateData: updatingDetails =
                        await reddisConfigForCaching.gettingTestData(
                            `${studentId}:${entry.id}:${entry.created_at}:updateData`
                        );
                    return {
                        testId:     entry.id,
                        created_at: entry.created_at,
                        updateData,
                    };
                })
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
    async getTestUpdateDataFromReddis(studentId: string, testId: string, created_at: string): Promise<updatingDetails | null> {
        try {
            const updateData: updatingDetails =
                await reddisConfigForCaching.gettingTestData(
                    `${studentId}:${testId}:${created_at}:updateData`
                );
            return updateData ?? null;

        } catch (err: any) {
            console.error("❌ Redis getTestUpdateDataFromReddis failed:", err);
            return null;
        }
    }

    // =================================================================
    // UPDATE DATA — Upsert (always one entry per testId, no duplicates)
    // =================================================================
    async upsertTestUpdateData(studentId: string, testId: string, created_at: string, updateData: updatingDetails) {
        try {
            // ── 1. Get current upper layer index ──────────────────────
            let upperLayer: cachingDataTestUpperLayer =
                await reddisConfigForCaching.gettingTestData(`${studentId}:updateUpperLayer`);

            if (!upperLayer) {
                upperLayer = { testId: [] };
            }

            // ── 2. Check if this testId already exists ────────────────
            const existingEntry = upperLayer.testId.find((entry: any) => entry.id === testId);

            if (existingEntry) {
                // Delete the stale data key with the OLD timestamp
                await reddisConfigForCaching.deletingTestData(
                    `${studentId}:${testId}:${existingEntry.created_at}:updateData`
                );
                console.log(`🗑️ Deleted stale Redis key for testId: ${testId} | old timestamp: ${existingEntry.created_at}`);
            }

            // ── 3. Remove old index entry ─────────────────────────────
            upperLayer.testId = upperLayer.testId.filter((entry: any) => entry.id !== testId);

            // ── 4. Push latest entry into index ───────────────────────
            upperLayer.testId.push({ id: testId, created_at });

            // ── 5. Persist both in parallel ───────────────────────────
            await Promise.all([
                reddisConfigForCaching.settingTestData(
                    `${studentId}:${testId}:${created_at}:updateData`,
                    updateData
                ),
                reddisConfigForCaching.settingTestData(
                    `${studentId}:updateUpperLayer`,
                    upperLayer
                ),
            ]);

            console.log(`✅ Redis upserted updateData for testId: ${testId} | timestamp: ${created_at}`);

        } catch (err: any) {
            // ── Never let Redis failure break the main flow ───────────
            console.error("❌ Redis upsertTestUpdateData failed:", err);
        }
    }

    // =================================================================
    // UPDATE DATA — Delete a test's update entry (call after DB confirms write)
    // =================================================================
    async deleteTestUpdateData(studentId: string, testId: string) {
        try {
            // ── 1. Get upper layer to find the timestamp ──────────────
            const upperLayer: cachingDataTestUpperLayer =
                await reddisConfigForCaching.gettingTestData(`${studentId}:updateUpperLayer`);

            if (!upperLayer || !upperLayer.testId?.length) return;

            const existingEntry = upperLayer.testId.find((entry: any) => entry.id === testId);

            if (!existingEntry) {
                console.log(`⚠️ No Redis entry found to delete for testId: ${testId}`);
                return;
            }

            // ── 2. Delete the data key ────────────────────────────────
            await reddisConfigForCaching.deletingTestData(
                `${studentId}:${testId}:${existingEntry.created_at}:updateData`
            );

            // ── 3. Remove from index and persist ─────────────────────
            upperLayer.testId = upperLayer.testId.filter((entry: any) => entry.id !== testId);

            await reddisConfigForCaching.settingTestData(
                `${studentId}:updateUpperLayer`,
                upperLayer
            );

            console.log(`🗑️ Redis fully removed updateData for testId: ${testId}`);

        } catch (err: any) {
            console.error("❌ Redis deleteTestUpdateData failed:", err);
        }
    }
}

export const reddisService = new ReddisService();