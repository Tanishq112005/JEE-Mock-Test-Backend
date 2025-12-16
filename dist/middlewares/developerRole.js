"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.developerRoleMiddleware = void 0;
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const developerRoleMiddleware = (req, res, next) => {
    if (req.type == client_1.UserType.Developer) {
        return next();
    }
    else {
        res.status(500).json(new ApiError_1.default("Unauthorised Access"));
    }
};
exports.developerRoleMiddleware = developerRoleMiddleware;
