"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reddisService = void 0;
const caching_1 = require("../lib/caching");
class ReddisService {
    constructor() { }
    async reddisTestData(studentId) {
        try {
            const usersTestData = await caching_1.reddisConfigForCaching.gettingData(`${studentId}:testUpperLayer`);
            if (!usersTestData || !usersTestData.testId?.length) {
                return { testData: [] };
            }
            // ── Fetch all in parallel instead of sequential loop ─────
            const userTestReddis = await Promise.all(usersTestData.testId.map(async (entry) => {
                const testData = await caching_1.reddisConfigForCaching.gettingData(`${studentId}:${entry.id}:${entry.created_at}`);
                return {
                    testId: entry.id,
                    created_at: entry.created_at,
                    testData,
                };
            }));
            return {
                testData: userTestReddis.filter((t) => t.testData != null),
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    async reddisPraticeWiseData(studentId) {
        try {
            const userPraticeWiseData = await caching_1.reddisConfigForCaching.gettingData(`${studentId}:praticeUpperLayer`);
            if (!userPraticeWiseData || !userPraticeWiseData.praticeStatus?.length) {
                return { praticeWiseData: [] };
            }
            // ── Fetch all in parallel instead of sequential loop ─────
            const userPraticeWiseReddis = await Promise.all(userPraticeWiseData.praticeStatus.map(async (entry) => {
                const questionData = await caching_1.reddisConfigForCaching.gettingData(`${studentId}:${entry.questionId}:${entry.created_at}`);
                return {
                    questionId: entry.questionId,
                    created_at: entry.created_at,
                    questionData,
                };
            }));
            return {
                praticeWiseData: userPraticeWiseReddis.filter((q) => q.questionData != null),
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
}
exports.reddisService = new ReddisService();
