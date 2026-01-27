"use strict";
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
        console.log("DEBUG [Middleware] Decoded Token:", decoded);
        // --- FIX START ---
        // If verifyAccessToken returns a string (like "jwt expired") or null, reject it.
        if (!decoded || typeof decoded === "string" || !decoded.id) {
            throw new Error("Invalid Token Content");
        }
        // --- FIX END ---
        // Now we know decoded is a valid object
        req.user = decoded.id;
        req.type = decoded.type;
        console.log("DEBUG [Middleware] Set req.user to:", req.user);
        return next();
    }
    catch (err) {
        // This catch block will now handle "jwt expired" and "Invalid Token Content"
        console.log("DEBUG [Middleware] Token Validation Failed");
        return res.status(401).json(new ApiError_1.default("Invalid or expired access token", ["Forbidden"]));
    }
};
exports.authMiddleware = authMiddleware;
