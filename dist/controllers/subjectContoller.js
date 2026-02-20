"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectController = exports.SubjectController = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const subject_db_1 = require("../repositories/subject.db");
const client_1 = require("@prisma/client");
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class SubjectController {
    constructor() {
    }
    // adding the subject
    createSubject = async (req, res) => {
        const { name } = req.body;
        try {
            if (!Object.values(client_1.SubjectName).includes(name)) {
                return res.status(400).json(new ApiError_1.default("Invalid subject name"));
            }
            await subject_db_1.subject.addingSubject(name);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Subject created successfully"));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in creating the subject", err));
        }
    };
    // deleting the subject
    deletingSubject = async (req, res) => {
        const { name } = req.body;
        try {
            if (!Object.values(client_1.SubjectName).includes(name)) {
                return res.status(400).json(new ApiError_1.default("Invalid subject name"));
            }
            await subject_db_1.subject.deletingSubject(name);
            return res.status(200).json(new ApiResponse_1.default("Subject is deleted successfully"));
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Error in deleting the subject", err));
        }
    };
    // giving all the subject name
    givingSubjectName = async (req, res) => {
        try {
            const subjectList = await subject_db_1.subject.readingAllSubjects();
            res.status(200).json(new ApiResponse_1.default("All Subject List Is : ", subjectList));
        }
        catch (err) {
            console.error(err);
            res.status(500).json(new ApiError_1.default("Error in giving the name of all subject from the database", err));
        }
    };
}
exports.SubjectController = SubjectController;
exports.subjectController = new SubjectController();
