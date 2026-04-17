"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookMarkedController = void 0;
const bookMarked_db_1 = require("../repositories/bookMarked.db");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class BookMarkedController {
    constructor() {
    }
    create = async (req, res) => {
        try {
            const studentId = req.user;
            const { questionId } = req.body;
            await bookMarked_db_1.bookMarked.add(studentId, questionId);
            return res.status(200).json(new ApiResponse_1.default("Question Is SuccessFully Added In the List"));
        }
        catch (err) {
            return res.status(400).json(new ApiError_1.default("Error in Making The Question BookMarked", err));
        }
    };
    checking = async (req, res) => {
        try {
            const studentId = req.user;
            const { questionId } = req.body;
            const checking = await bookMarked_db_1.bookMarked.checking(studentId, questionId);
            if (checking) {
                return res.status(200).json(new ApiResponse_1.default("Question Is Already Present In BookMarked List"));
            }
            else {
                return res.status(200).json(new ApiResponse_1.default("Question Is Not Already Present In BookMarked List"));
            }
        }
        catch (err) {
            return res.status(400).json(new ApiError_1.default("Error In Checking", err));
        }
    };
    remove = async (req, res) => {
        try {
            const studentId = req.user;
            const { questionId } = req.params;
            await bookMarked_db_1.bookMarked.remove(studentId, questionId);
            return res.status(200).json(new ApiResponse_1.default("Question Is Removed From The BookMarked"));
        }
        catch (err) {
            return res.status(400).json(new ApiError_1.default("Error In Removing The Question", err));
        }
    };
    get = async (req, res) => {
        try {
            const studentId = req.user;
            const questionList = await bookMarked_db_1.bookMarked.bookMarkedQuestion(studentId);
            return res.status(200).json(new ApiResponse_1.default("Question List Is", questionList));
        }
        catch (err) {
            return res.status(400).json(new ApiError_1.default("Error in Getting the Bookmarked Question", err));
        }
    };
}
exports.bookMarkedController = new BookMarkedController();
