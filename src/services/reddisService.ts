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

    async reddisTestData(studentId: string) {
        try {
            const usersTestData: cachingDataTestUpperLayer =
                await reddisConfigForCaching.gettingData(`${studentId}:testUpperLayer`);

            if (!usersTestData || !usersTestData.testId?.length) {
                return { testData: [] };
            }

            // ── Fetch all in parallel instead of sequential loop ─────
            const userTestReddis = await Promise.all(
                usersTestData.testId.map(async (entry) => {
                    const testData: TestEvaluationSummaryReport =
                        await reddisConfigForCaching.gettingData(
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

    async reddisPraticeWiseData(studentId: any) {
        try {
            const userPraticeWiseData: cachingDataPraticeUpperLayer =
                await reddisConfigForCaching.gettingData(`${studentId}:praticeUpperLayer`);

            if (!userPraticeWiseData || !userPraticeWiseData.praticeStatus?.length) {
                return { praticeWiseData: [] };
            }

            // ── Fetch all in parallel instead of sequential loop ─────
            const userPraticeWiseReddis = await Promise.all(
                userPraticeWiseData.praticeStatus.map(async (entry) => {
                    const questionData =
                        await reddisConfigForCaching.gettingData(
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
}

export const reddisService = new ReddisService();