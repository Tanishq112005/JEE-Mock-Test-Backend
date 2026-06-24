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
exports.redisController = exports.RedisController = void 0;
const redisManager_1 = __importDefault(require("../lib/redisManager")); // Path verify kar lena
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
class RedisController {
    // 1. Auth/OTP Ring mein naye Redis Instances add karna
    addAuthNodes = async (req, res) => {
        try {
            const { configs } = req.body;
            if (!configs || !Array.isArray(configs) || configs.length === 0) {
                return res
                    .status(400)
                    .json(new ApiError_1.default("Please provide a valid array of Redis configurations.", 400));
            }
            console.log(`[Admin Control] Adding ${configs.length} new node(s) to Auth Ring...`);
            const dynamicConfigs = configs.map((c) => ({ ...c, isDynamic: true }));
            await redisManager_1.default.addAuthInstances(dynamicConfigs);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Successfully added new Redis instances to the Auth Ring."));
        }
        catch (err) {
            console.error("Error adding Auth Redis node:", err);
            return res
                .status(500)
                .json(new ApiError_1.default("Failed to add Auth Redis instances.", err));
        }
    };
    // 2. Dashboard/Test Data Ring mein naye Redis Instances add karna
    addDashboardNodes = async (req, res) => {
        try {
            const { configs } = req.body;
            if (!configs || !Array.isArray(configs) || configs.length === 0) {
                return res
                    .status(400)
                    .json(new ApiError_1.default("Please provide a valid array of Redis configurations.", 400));
            }
            console.log(`[Admin Control] Adding ${configs.length} new node(s) to Dashboard Ring...`);
            const dynamicConfigs = configs.map((c) => ({ ...c, isDynamic: true }));
            await redisManager_1.default.addDashboardInstances(dynamicConfigs);
            return res
                .status(200)
                .json(new ApiResponse_1.default("Successfully added new Redis instances to the Dashboard Ring."));
        }
        catch (err) {
            console.error("Error adding Dashboard Redis node:", err);
            return res
                .status(500)
                .json(new ApiError_1.default("Failed to add Dashboard Redis instances.", err));
        }
    };
    // 3. System Shutdown (Emergency switch) - Optional but good to have
    shutdownClusters = async (req, res) => {
        try {
            console.log("[Admin Control] Emergency Shutdown initiated for all Redis Clusters.");
            await redisManager_1.default.disconnectAll();
            return res
                .status(200)
                .json(new ApiResponse_1.default("All Redis connections have been safely disconnected."));
        }
        catch (err) {
            return res
                .status(500)
                .json(new ApiError_1.default("Failed to disconnect clusters.", err));
        }
    };
    // RedisController mein yeh 3 naye methods add karo:
    // 4. Get all Active Redis Nodes
    getActiveNodes = async (req, res) => {
        try {
            const nodes = redisManager_1.default.getActiveClusters();
            return res
                .status(200)
                .json(new ApiResponse_1.default("Successfully fetched active Redis clusters.", nodes));
        }
        catch (err) {
            console.error("Error fetching Redis nodes:", err);
            return res
                .status(500)
                .json(new ApiError_1.default("Failed to fetch active nodes.", err));
        }
    };
    // 5. Remove Node from Auth Ring
    removeAuthNode = async (req, res) => {
        try {
            const { type, url, host, port } = req.body;
            if (!type || (type !== 1 && type !== 2)) {
                return res.status(400).json(new ApiError_1.default("Valid type (1 or 2) is required.", 400));
            }
            if (type === 1 && (!host || !port)) {
                return res.status(400).json(new ApiError_1.default("Host and port are required for type 1.", 400));
            }
            if (type === 2 && !url) {
                return res.status(400).json(new ApiError_1.default("URL is required for type 2.", 400));
            }
            const configData = { type, url, host, port: port ? Number(port) : undefined };
            const isRemoved = await redisManager_1.default.removeAuthInstance(configData);
            const identifier = type === 2 ? url : `${host}:${port}`;
            if (isRemoved) {
                return res
                    .status(200)
                    .json(new ApiResponse_1.default(`Successfully removed ${identifier} from Auth Ring.`));
            }
            else {
                return res
                    .status(404)
                    .json(new ApiError_1.default("Node not found in Auth Ring.", 404));
            }
        }
        catch (err) {
            console.error("Error removing Auth Redis node:", err);
            return res
                .status(500)
                .json(new ApiError_1.default("Failed to remove Auth node.", err));
        }
    };
    // 6. Remove Node from Dashboard Ring
    removeDashboardNode = async (req, res) => {
        try {
            const { type, url, host, port } = req.body;
            if (!type || (type !== 1 && type !== 2)) {
                return res.status(400).json(new ApiError_1.default("Valid type (1 or 2) is required.", 400));
            }
            if (type === 1 && (!host || !port)) {
                return res.status(400).json(new ApiError_1.default("Host and port are required for type 1.", 400));
            }
            if (type === 2 && !url) {
                return res.status(400).json(new ApiError_1.default("URL is required for type 2.", 400));
            }
            const configData = { type, url, host, port: port ? Number(port) : undefined };
            const isRemoved = await redisManager_1.default.removeDashboardInstance(configData);
            const identifier = type === 2 ? url : `${host}:${port}`;
            if (isRemoved) {
                return res
                    .status(200)
                    .json(new ApiResponse_1.default(`Successfully removed ${identifier} from Dashboard Ring.`));
            }
            else {
                return res
                    .status(404)
                    .json(new ApiError_1.default("Node not found in Dashboard Ring.", 404));
            }
        }
        catch (err) {
            console.error("Error removing Dashboard Redis node:", err);
            return res
                .status(500)
                .json(new ApiError_1.default("Failed to remove Dashboard node.", err));
        }
    };
    // 7. Flush specific key or flush all data
    flushData = async (req, res) => {
        try {
            const { key } = req.body;
            const { questionRedisclient } = await Promise.resolve().then(() => __importStar(require("../lib/redis")));
            if (key) {
                // Delete a specific key
                const deletedCount = await questionRedisclient.del(key);
                if (deletedCount > 0) {
                    return res.status(200).json(new ApiResponse_1.default(`Successfully deleted key: ${key}`));
                }
                else {
                    return res.status(404).json(new ApiError_1.default(`Key not found: ${key}`, 404));
                }
            }
            else {
                // Flush the entire database
                await questionRedisclient.flushAll();
                console.log("[Admin Control] Flushed all data from Redis.");
                return res.status(200).json(new ApiResponse_1.default("Successfully flushed all data from Redis."));
            }
        }
        catch (err) {
            console.error("Error flushing Redis data:", err);
            return res.status(500).json(new ApiError_1.default("Failed to flush Redis data.", err));
        }
    };
}
exports.RedisController = RedisController;
exports.redisController = new RedisController();
