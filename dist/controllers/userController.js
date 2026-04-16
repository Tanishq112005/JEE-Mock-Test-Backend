"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const user_db_1 = require("../repositories/user.db");
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class UserController {
    constructor() {
    }
    stageNumber = async (req, res) => {
        try {
            const studentId = req.user;
            let stageNumber = await user_db_1.user.stageNumber(studentId);
            stageNumber = stageNumber + 1;
            return res.status(200).json(new ApiResponse_1.default(`Student Is At The Stage ${stageNumber}`, stageNumber));
        }
        catch (err) {
            return new ApiError_1.default("Error in getting the stage number", err);
        }
    };
    stage1 = async (req, res) => {
        try {
            const { className } = req.body;
            const studentId = req.user;
            if (!Object.values(client_1.Class).includes(className)) {
                return res.status(400).json(new ApiError_1.default("Invalid Class Name"));
            }
            await user_db_1.user.stage1(className, studentId);
            return res.status(200).json(new ApiResponse_1.default("Data Is Updated"));
        }
        catch (err) {
            return res.status(404).json(new ApiError_1.default("Error Comming During the Stage 1 Submission", err));
        }
    };
    stage2 = async (req, res) => {
        try {
            const { category, gender } = req.body;
            const studentId = req.user;
            if (!Object.values(client_1.Category).includes(category)) {
                return res.status(400).json(new ApiError_1.default("Invalid Category"));
            }
            if (!Object.values(client_1.Gender).includes(gender)) {
                return res.status(400).json(new ApiError_1.default("Invalid Gender"));
            }
            await user_db_1.user.stage2(gender, category, studentId);
            return res.status(200).json(new ApiResponse_1.default("Data Is Updated"));
        }
        catch (err) {
            return res.status(404).json(new ApiError_1.default("Error Comming During the Stage 2 Submission", err));
        }
    };
    stage3 = async (req, res) => {
        try {
            const { countryCode, mobileNumber } = req.body;
            const studentId = req.user;
            await user_db_1.user.stage3(countryCode, mobileNumber, studentId);
            return res.status(200).json(new ApiResponse_1.default("Data Is Updated"));
        }
        catch (err) {
            return res.status(404).json(new ApiError_1.default("Error Comming During the Stage 3 Submission", err));
        }
    };
    studentProfile = async (req, res) => {
        try {
            const studentId = req.user;
            const finalData = await user_db_1.user.studentProfile(studentId);
            return res.status(200).json(new ApiResponse_1.default("Student Profile Data", finalData));
        }
        catch (err) {
            console.log(err);
            return res.status(404).json(new ApiError_1.default("Student profile not found. Please complete your profile setup", err));
        }
    };
    updateData = async (req, res) => {
        try {
            const { name, className, category, countryCode, mobileNumber, gender } = req.body;
            const studentId = req.user;
            if (!Object.values(client_1.Class).includes(className)) {
                return res.status(400).json(new ApiError_1.default("Invalid Class Name"));
            }
            if (!Object.values(client_1.Category).includes(category)) {
                return res.status(400).json(new ApiError_1.default("Invalid Category"));
            }
            if (!Object.values(client_1.Gender).includes(gender)) {
                return res.status(400).json(new ApiError_1.default("Invalid Gender"));
            }
            await user_db_1.user.updateStudent(studentId, className, gender, category, name, countryCode, mobileNumber);
            return res.status(200).json(new ApiResponse_1.default("Your Profile is Updated"));
        }
        catch (err) {
            return res.status(400).json(new ApiError_1.default("Error in updating the Student Profile", err));
        }
    };
}
;
exports.userController = new UserController();
