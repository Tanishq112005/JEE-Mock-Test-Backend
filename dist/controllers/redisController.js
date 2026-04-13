"use strict";
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
            await redisManager_1.default.addAuthInstances(configs);
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
            await redisManager_1.default.addDashboardInstances(configs);
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
            const { host, port } = req.body;
            if (!host || !port) {
                return res
                    .status(400)
                    .json(new ApiError_1.default("Host and port are required.", 400));
            }
            const isRemoved = await redisManager_1.default.removeAuthInstance(host, Number(port));
            if (isRemoved) {
                return res
                    .status(200)
                    .json(new ApiResponse_1.default(`Successfully removed ${host}:${port} from Auth Ring.`));
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
            const { host, port } = req.body;
            if (!host || !port) {
                return res
                    .status(400)
                    .json(new ApiError_1.default("Host and port are required.", 400));
            }
            const isRemoved = await redisManager_1.default.removeDashboardInstance(host, Number(port));
            if (isRemoved) {
                return res
                    .status(200)
                    .json(new ApiResponse_1.default(`Successfully removed ${host}:${port} from Dashboard Ring.`));
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
}
exports.RedisController = RedisController;
exports.redisController = new RedisController();
