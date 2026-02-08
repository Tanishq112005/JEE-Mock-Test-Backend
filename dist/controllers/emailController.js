"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailController = void 0;
const emailAdding_producer_1 = require("../rabbitmq/producers/emailAdding-producer");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class EmailController {
    constructor() {
    }
    addEmail = async (req, res) => {
        const { email } = req.body;
        try {
            const addEmail = await emailAdding_producer_1.emailAddingProducer.add(email);
            res.status(200).json(new ApiResponse_1.default("Email is Added SucessFully"));
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Email is Already Added", err));
        }
    };
}
exports.emailController = new EmailController();
