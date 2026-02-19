"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reddisService = void 0;
const caching_1 = require("../lib/caching");
const testEvaluationService_1 = require("./testEvaluationService");
const uniqueCountService_1 = require("./uniqueCountService");
class ReddisService {
    constructor() {
    }
    async reddisTestData(studentId) {
        try {
            // collecting the data of the user for the questions 
            const usersTestData = await caching_1.reddisConfigForCaching.gettingData(`${studentId}:testUpperLayer`);
            // now getting the user data 
            let userTestReddis = [];
            if (usersTestData) {
                for (let i = 0; i < usersTestData.testId.length; i++) {
                    const testId = usersTestData.testId[i];
                    const testData = await caching_1.reddisConfigForCaching.gettingData(`${studentId}:${testId}`);
                    const finalTestResult = await testEvaluationService_1.testEvaluation.evaluation(testData, studentId);
                    userTestReddis.push({
                        testId: testId,
                        created_at: testData.created_at,
                        finalTestResult
                    });
                }
            }
            return {
                testData: userTestReddis
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    async reddisChapterWiseData(studentId) {
        try {
            const usersChapterWiseData = await caching_1.reddisConfigForCaching.gettingData(`${studentId}:chapterUpperLayer`);
            let userChapterWiseReddis = [];
            if (usersChapterWiseData) {
                for (let i = 0; i < usersChapterWiseData.questionId.length; i++) {
                    const questionId = usersChapterWiseData.questionId[i];
                    await uniqueCountService_1.questionBitmapRegistry.markAttempted(studentId, questionId);
                    const questionDetails = await caching_1.reddisConfigForCaching.gettingData(`${studentId}:${questionId}`);
                    userChapterWiseReddis.push(questionDetails);
                }
            }
            return {
                chapterWiseData: userChapterWiseReddis
            };
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
}
exports.reddisService = new ReddisService();
