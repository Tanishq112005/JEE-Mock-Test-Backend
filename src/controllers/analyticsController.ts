import { cacheService } from "../lib/caching";
import { analytics } from "../repositories/analytics.db";
import { reportService } from "../services/reportService";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { streakCacheService } from "../services/streakCacheService";
import { encryptPayload } from "../utils/encryption";
class AnalyticsController {

    constructor() {}


    public testAnalytics = async (req: any, res: any) => {
        try {
            const { testId, created_at } = req.query;  
            const studentId = req.user;                  

            if (!testId || !created_at) {
                return res.status(400).json(
                    new ApiError("testId and created_at are required")
                );
            }

          
            const testData = await cacheService.getCache(
                `${studentId}:${testId}:${created_at}`
            );

            if (testData) {
                return res.status(200).json(
                    new ApiResponse("Test data from cache", testData)
                );
            }

           
            const data = await analytics.getFullTestSummaryReport(testId, studentId);

            if (!data) {
                return res.status(404).json(
                    new ApiError("Test report not found")
                );
            }

            return res.status(200).json(
                new ApiResponse("Test data from DB", encryptPayload(data))
            );

        } catch (err: any) {
            return res.status(500).json(
                new ApiError("Error in getting the test", err)
            );
        }
    };

    
    public analyticsData = async (req: any, res: any) => {   
        try {
            const studentId = req.user;                     

            const finalDashboard = await reportService.fullDashboard(studentId);

            return res.status(200).json(
                new ApiResponse("Full analytics", encryptPayload(finalDashboard))
            );

        } catch (err: any) {
            return res.status(500).json(
                new ApiError("Error in getting analytics", err)
            );
        }
    };

    
    public studentReport = async (req: any, res: any) => {
        try {
            const studentId = req.user;                      

            const studentReport = await reportService.studentSnapshot(studentId);

            return res.status(200).json(
                new ApiResponse("Student report generated", encryptPayload(studentReport))
            );

        } catch (err: any) {
            console.log(err) ; 
            return res.status(500).json(
                new ApiError("Error in generating the report", err)
            );
        }   
    };

    public getStreakStatus = async (req: any, res: any) => {
        try {
            const studentId = req.user;
            const streakData = await streakCacheService.getStreakStatus(studentId);
            return res.status(200).json(
                new ApiResponse("Streak data retrieved successfully", encryptPayload(streakData))
            );
        } catch (err: any) {
            console.error(err);
            return res.status(500).json(
                new ApiError("Error in retrieving streak status", err)
            );
        }
    };
}

export const analyticsController = new AnalyticsController();