"use strict";
// middleware for checking access token 
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const jwtToken_1 = require("../utils/jwtToken");
const authMiddleware = (req, res, next) => {
    const accessToken = req.headers["authorization"]?.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json(new ApiError_1.default("Access token is required", ["Unauthorized"]));
    }
    try {
        const decoded = (0, jwtToken_1.verifyAccessToken)(accessToken);
        req.user = decoded.id;
        return next();
    }
    catch (err) {
        return res.status(403).json(new ApiError_1.default("Invalid or expired access token", ["Forbidden"]));
    }
};
exports.authMiddleware = authMiddleware;
