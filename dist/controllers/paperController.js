"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperController = exports.PaperController = void 0;
const paper_db_1 = require("../repositories/paper.db");
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class PaperController {
    constructor() { }
    createPaper = async (req, res) => {
        try {
            const paperData = req.body;
            if (!paperData.exam ||
                !Object.values(client_1.ExamName).includes(paperData.exam)) {
                return res
                    .status(400)
                    .json(new ApiError_1.default("Invalid or missing Exam Name"));
            }
            if (!Object.values(client_1.Session).includes(paperData.session)) {
                return res.status(400).json(new ApiError_1.default("Session Name is Wrong"));
            }
            const paperId = await paper_db_1.paper.addingPapers(paperData);
            return res
                .status(201)
                .json(new ApiResponse_1.default("Paper created successfully", {
                "paperId": paperId
            }));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in creating the paper", err));
        }
    };
    deletePaper = async (req, res) => {
        const { paperId } = req.params;
        try {
            if (!paperId) {
                return res.status(400).json(new ApiError_1.default("Paper ID is required"));
            }
            await paper_db_1.paper.deletingPapers(paperId);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Paper deleted successfully"));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in deleting the paper", err));
        }
    };
    getAllPapers = async (req, res) => {
        try {
            const year = Number(req.query.year) || 0;
            const examName = req.query.examName;
            if (year === 0 && !examName) {
                return res
                    .status(400)
                    .json(new ApiError_1.default("Please provide a 'year' or 'examName' query parameter"));
            }
            if (examName && !Object.values(client_1.ExamName).includes(examName)) {
                return res.status(400).json(new ApiError_1.default("Invalid Exam Name provided"));
            }
            const papersList = await paper_db_1.paper.gettingPaperInformation(year, examName);
            if (papersList instanceof ApiError_1.default) {
                return res.status(400).json(papersList);
            }
            return res
                .status(200)
                .json(new ApiResponse_1.default("Papers fetched successfully", papersList));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in fetching papers", err));
        }
    };
    addingMarkingScheme = async (req, res) => {
        try {
            const { payload } = req.body;
            await paper_db_1.paper.addpaperMarkingScheme(payload);
            return res.status(200).json(new ApiResponse_1.default("Paper marking Scheme Is Uploaded"));
        }
        catch (err) {
            return res.status(400).json(new ApiError_1.default("Error In Adding The Marking Scheme"));
        }
    };
    gettingMarkingScheme = async (req, res) => {
        try {
            const { paperId } = req.params;
            const data = await paper_db_1.paper.paperMarkingScheme(paperId);
            return res.status(200).json(new ApiResponse_1.default("Your Marking Scheme Of The Paper", data));
        }
        catch (err) {
            return res.status(400).json(new ApiError_1.default("Error in getting the Marking Scheme"));
        }
    };
}
exports.PaperController = PaperController;
exports.paperController = new PaperController();
