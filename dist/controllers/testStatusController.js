"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testStatusController = void 0;
const updateTestDetails_producer_1 = require("../rabbitmq/producers/updateTestDetails-producer");
const testStatus_db_1 = require("../repositories/testStatus.db");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const client_1 = require("@prisma/client");
class TestStatusController {
    constructor() {
    }
    // creating new test 
    createTestStatus = async (req, res) => {
        const { paperId } = req.body;
        const userId = req.user;
        try {
            const testStatusDetails = await testStatus_db_1.testStatus.startNewTestSession(userId, paperId);
            return res.status(200).json(new ApiResponse_1.default("Test Details", testStatusDetails));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in Creating Test", err));
        }
    };
    // getting question and details 
    gettingQuestionAndDetails = async (req, res) => {
        const { testStatusId } = req.query;
        const userId = req.user;
        try {
            const gettingTheTestResponse = await testStatus_db_1.testStatus.getSessionData(testStatusId, userId);
            return res.status(200).json(new ApiResponse_1.default("Your question + test result", gettingTheTestResponse));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting question details", err));
        }
    };
    updatingTheDetails = async (req, res) => {
        const { testId, paperId, timeLeftSeconds, created_at, timeStamp, state, activeSectionId, activeQuestionId, questionsById } = req.body;
        const userId = req.user;
        try {
            const questionStatusArray = Object.values(questionsById || {}).map((q) => {
                let userAnswer = [];
                if (q.numericAnswer != null) {
                    const userNumericAnswerInString = q.numericAnswer.toString();
                    userAnswer.push(userNumericAnswerInString);
                }
                if (q.selectedOptionIds != null) {
                    userAnswer = q.selectedOptionIds;
                }
                if (q.status == client_1.AttemptStatus.answered) {
                    return {
                        isVisited: q.isVisited,
                        markedForReview: q.markedForReview,
                        questionId: q.questionId,
                        userAnswer: userAnswer,
                        timeSpent: q.timeSpentSeconds || 0,
                        status: client_1.AttemptStatus.answered
                    };
                }
                else {
                    return {
                        isVisited: q.isVisited,
                        markedForReview: q.markedForReview,
                        questionId: q.questionId,
                        userAnswer: userAnswer,
                        timeSpent: q.timeSpentSeconds || 0,
                        status: client_1.AttemptStatus.notAnswered
                    };
                }
            });
            const details = {
                testId: testId,
                userId: userId,
                paperId: paperId,
                timeLeft: timeLeftSeconds,
                activeQuestionId: activeQuestionId,
                activeSection: activeSectionId,
                created_at: created_at,
                timeStamp: timeStamp,
                state: state,
                questionStatus: questionsById
            };
            // sending in the queue 
            const pushingInQueue = await updateTestDetails_producer_1.updatingTestDetailsProducer.updateData(details);
            return res.status(200).json(new ApiResponse_1.default("Pushed in queue"));
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Error in updating the details", err));
        }
    };
    //  last test session of the user with the paper 
    LastTestDetails = async (req, res) => {
        const { paperId } = req.query;
        const userId = req.user;
        try {
            const testStatusDetails = await testStatus_db_1.testStatus.gettingAllTestDetails(userId, paperId);
            let payload;
            if (testStatusDetails.length === 0) {
                payload = {};
            }
            else {
                payload = {
                    status: testStatusDetails[0].status,
                    created_at: testStatusDetails[0].created_at,
                    testId: testStatusDetails[0].id
                };
            }
            return res.status(200).json(new ApiResponse_1.default("Last Test Data", payload));
        }
        catch (err) {
            return res.status(500).json(new ApiError_1.default("Error in getting Details", err));
        }
    };
}
exports.testStatusController = new TestStatusController();
