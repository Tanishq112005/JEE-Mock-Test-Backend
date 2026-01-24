"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionController = exports.QuestionController = void 0;
const question_db_1 = require("../repositories/question.db");
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const questionService_1 = require("../services/questionService");
class QuestionController {
    constructor() { }
    createSingleQuestion = async (req, res) => {
        const { paperId, questionNumber } = req.body;
        try {
            const questionformatData = await questionService_1.questionService.htmlContentQuestions(req.body);
            await question_db_1.question.addingSingleQuestion(questionformatData, paperId, questionNumber);
            return res
                .status(201)
                .json(new ApiResponse_1.default("Question created successfully"));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in creating the question", err));
        }
    };
    uploadingAllQuestion = async (req, res) => {
        try {
            const { data, paperId } = req.body;
            if (!data || !data.results) {
                return res.status(400).json(new ApiError_1.default("Invalid JSON format. 'results' array missing."));
            }
            const result = await questionService_1.questionService.uploadBulkQuestions(data, paperId);
            return res
                .status(201)
                .json(new ApiResponse_1.default(result.message, result));
        }
        catch (err) {
            console.error("Controller Error:", err);
            return res
                .status(500)
                .json(new ApiError_1.default("Error in bulk uploading questions", err));
        }
    };
    deleteQuestion = async (req, res) => {
        const { questionId } = req.params;
        try {
            if (!questionId) {
                return res.status(400).json(new ApiError_1.default("Question ID is required"));
            }
            await question_db_1.question.deletingQuestion(questionId);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Question deleted successfully"));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in deleting the question", err));
        }
    };
    getQuestions = async (req, res) => {
        try {
            const year = req.query.year ? Number(req.query.year) : undefined;
            const chapterId = req.query.chapterId;
            const paperId = req.query.paperId;
            const questionId = req.query.questionId;
            const subject = req.query.subject;
            if (subject && !Object.values(client_1.SubjectName).includes(subject)) {
                return res
                    .status(400)
                    .json(new ApiError_1.default("Invalid Subject Name provided"));
            }
            const questionsList = await question_db_1.question.gettingQuestion(year, chapterId, paperId, questionId, subject);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Questions fetched successfully", questionsList));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in fetching questions", err));
        }
    };
    getPaperQuestions = async (req, res) => {
        const { paperId } = req.params;
        try {
            if (!paperId) {
                return res.status(400).json(new ApiError_1.default("Paper ID is required"));
            }
            const paperData = await question_db_1.question.getQuestionsByPaperId(paperId);
            // 3. Check if paper exists
            if (!paperData) {
                return res.status(404).json(new ApiError_1.default("Paper not found"));
            }
            return res
                .status(200)
                .json(new ApiResponse_1.default("Paper questions fetched successfully", paperData));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in fetching paper questions", err));
        }
    };
}
exports.QuestionController = QuestionController;
exports.questionController = new QuestionController();
