"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = void 0;
const caching_1 = require("../lib/caching");
const analytics_db_1 = require("../repositories/analytics.db");
const reportService_1 = require("../services/reportService");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const streakCacheService_1 = require("../services/streakCacheService");
const encryption_1 = require("../utils/encryption");
class AnalyticsController {
    constructor() { }
    testAnalytics = async (req, res) => {
        try {
            const { testId, created_at } = req.query;
            const studentId = req.user;
            if (!testId || !created_at) {
                return res.status(400).json(new ApiError_1.default("testId and created_at are required"));
            }
            const testData = await caching_1.cacheService.getCache(`${studentId}:${testId}:${created_at}`);
            if (testData) {
                return res.status(200).json(new ApiResponse_1.default("Test data from cache", testData));
            }
            const data = await analytics_db_1.analytics.getFullTestSummaryReport(testId, studentId);
            if (!data) {
                return res.status(404).json(new ApiError_1.default("Test report not found"));
            }
            return res.status(200).json(new ApiResponse_1.default("Test data from DB", (0, encryption_1.encryptPayload)(data)));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting the test", err));
        }
    };
    analyticsData = async (req, res) => {
        try {
            const studentId = req.user;
            const finalDashboard = await reportService_1.reportService.fullDashboard(studentId);
            return res.status(200).json(new ApiResponse_1.default("Full analytics", (0, encryption_1.encryptPayload)(finalDashboard)));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting analytics", err));
        }
    };
    studentReport = async (req, res) => {
        try {
            const studentId = req.user;
            const studentReport = await reportService_1.reportService.studentSnapshot(studentId);
            return res.status(200).json(new ApiResponse_1.default("Student report generated", (0, encryption_1.encryptPayload)(studentReport)));
        }
        catch (err) {
            console.log(err);
            return res.status(500).json(new ApiError_1.default("Error in generating the report", err));
        }
    };
    getStreakStatus = async (req, res) => {
        try {
            const studentId = req.user;
            const streakData = await streakCacheService_1.streakCacheService.getStreakStatus(studentId);
            return res.status(200).json(new ApiResponse_1.default("Streak data retrieved successfully", (0, encryption_1.encryptPayload)(streakData)));
        }
        catch (err) {
            console.error(err);
            return res.status(500).json(new ApiError_1.default("Error in retrieving streak status", err));
        }
    };
}
exports.analyticsController = new AnalyticsController();
