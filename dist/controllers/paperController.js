"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperController = exports.PaperController = void 0;
const paper_db_1 = require("../repositories/paper.db");
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const encryption_1 = require("../utils/encryption");
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
            const { redisConfig, questionRedisclient, REDIS_CACHE_EXPIRATION } = await Promise.resolve().then(() => __importStar(require("../lib/redis")));
            const redisKey = redisConfig.getRedisPapersList(year, examName);
            const cachedPapers = await questionRedisclient.get(redisKey);
            if (cachedPapers) {
                console.log(`[Cache Hit] Papers list for year ${year} and exam ${examName || 'all'} coming from Redis.`);
                return res.status(200).json(new ApiResponse_1.default("Papers Details Successfully Fetched", (0, encryption_1.encryptPayload)(JSON.parse(cachedPapers))));
            }
            console.log(`[Cache Miss] Papers list for year ${year} and exam ${examName || 'all'} coming from Database.`);
            const papersList = await paper_db_1.paper.gettingPaperInformation(year, examName);
            if (papersList instanceof ApiError_1.default) {
                return res.status(400).json(papersList);
            }
            await questionRedisclient.setEx(redisKey, REDIS_CACHE_EXPIRATION, JSON.stringify(papersList));
            return res
                .status(200)
                .json(new ApiResponse_1.default("Papers Details Successfully Fetched", (0, encryption_1.encryptPayload)(papersList)));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Error in fetching papers", err));
        }
    };
}
exports.PaperController = PaperController;
exports.paperController = new PaperController();
