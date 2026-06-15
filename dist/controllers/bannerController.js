"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerController = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const client_1 = require("@prisma/client");
const banner_db_1 = require("../repositories/banner.db");
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const parseIST = (timeStr) => {
    if (!timeStr)
        return undefined;
    if (timeStr.includes('Z') || timeStr.includes('+') || timeStr.match(/-\d{2}:\d{2}$/)) {
        return new Date(timeStr);
    }
    return new Date(timeStr + "+05:30");
};
const formatIST = (date) => {
    if (!date)
        return undefined;
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(date.getTime() + istOffset);
    return istTime.toISOString().replace('Z', '+05:30');
};
class BannerController {
    constructor() {
    }
    createAndUpdate = async (req, res) => {
        try {
            const { type, isBanner, startTime, endTime, reason } = req.body;
            if (!Object.values(client_1.BannerType).includes(type)) {
                res.status(500).json(new ApiError_1.default("Please Correctly Enter The Type Of The Banner From The Given Types Only"));
                return;
            }
            const parsedStartTime = parseIST(startTime);
            const parsedEndTime = parseIST(endTime);
            await banner_db_1.bannerDB.creatingAndUpdatingBanner({
                type: type,
                isBanner: isBanner,
                startTime: parsedStartTime,
                endTime: parsedEndTime,
                reason: reason
            });
            res.status(200).json(new ApiResponse_1.default("Banner Is Created Successfully !"));
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Error In Creating Or Updating The Banner", err));
        }
    };
    getCurrentStatus = async (req, res) => {
        try {
            const data = await banner_db_1.bannerDB.currentBannerStatus();
            let formattedData = null;
            if (data) {
                formattedData = {
                    ...data,
                    startTime: formatIST(data.startTime),
                    endTime: formatIST(data.endTime)
                };
            }
            res.status(200).json({
                status: "Current Status of the Banner",
                data: formattedData
            });
        }
        catch (err) {
            res.status(500).json(new ApiError_1.default("Error In Getting The Current Status", err));
        }
    };
}
exports.bannerController = new BannerController();
