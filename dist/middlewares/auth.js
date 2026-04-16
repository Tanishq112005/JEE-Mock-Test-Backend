"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const jwtToken_1 = require("../utils/jwtToken");
const middleware_db_1 = require("../repositories/middleware.db");
const authMiddleware = async (req, res, next) => {
    const accessToken = req.headers["authorization"]?.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json(new ApiError_1.default("Access token is required", ["Unauthorized"]));
    }
    try {
        const decoded = (0, jwtToken_1.verifyAccessToken)(accessToken);
        console.log("DEBUG [Middleware] Decoded Token:", decoded);
        if (!decoded || typeof decoded === "string" || !decoded.id) {
            throw new Error("Invalid Token Content");
        }
        req.user = decoded.id;
        req.type = decoded.type;
        if (decoded.type == client_1.UserType.Student) {
            req.user = await middleware_db_1.middleware.gettingStudentId(req.user);
        }
        console.log("DEBUG [Middleware] Set req.user to:", req.user);
        return next();
    }
    catch (err) {
        console.log("DEBUG [Middleware] Token Validation Failed. Error:", err.message, err.stack);
        return res.status(401).json(new ApiError_1.default("Invalid or expired access token", ["Forbidden"]));
    }
};
exports.authMiddleware = authMiddleware;
