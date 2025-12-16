"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examController = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const client_1 = require("@prisma/client");
const exam_db_1 = require("../repositories/exam.db");
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class ExamController {
    constructor() { }
    // adding the exam
    createExam = async (req, res) => {
        const { name } = req.body;
        try {
            if (!Object.values(client_1.ExamName).includes(name)) {
                return res.status(400).json(new ApiError_1.default("Invalid exam name"));
            }
            await exam_db_1.exam.addingExam(name);
            res.status(200).json(new ApiResponse_1.default("Exam is successfully created"));
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Error in creating the exam", err));
        }
    };
    // deleting the exam
    deleteExam = async (req, res) => {
        const { name } = req.body;
        try {
            if (!Object.values(client_1.ExamName).includes(name)) {
                return res.status(400).json(new ApiError_1.default("Invalid exam name"));
            }
            await exam_db_1.exam.deletingExam(name);
            res.status(200).json(new ApiResponse_1.default("Exam is successfully deleted"));
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Error in deleting the exam", err));
        }
    };
    // getting all the exam
    givingExamName = async (req, res) => {
        try {
            const exmaList = await exam_db_1.exam.gettingExam();
            res.status(200).json(new ApiResponse_1.default("All Exams Present in db are :", exmaList));
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Error in getting the exam", err));
        }
    };
}
exports.examController = new ExamController();
