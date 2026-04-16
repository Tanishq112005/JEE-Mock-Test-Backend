"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const ApiResponse_1 = __importDefault(require("./utils/ApiResponse"));
// --- ROUTES ---
const auth_1 = require("./routes/auth");
const subject_1 = require("./routes/subject");
const exam_1 = require("./routes/exam");
const chapter_1 = require("./routes/chapter");
const paper_1 = require("./routes/paper");
const question_1 = require("./routes/question");
const testStatus_1 = require("./routes/testStatus");
// --- SERVICES & JOBS ---
const rabbitmq_connection_1 = require("./rabbitmq/connection/rabbitmq-connection");
const similarity_1 = require("./utils/similarity"); // 2. Hybrid Search Engine
const email_1 = require("./routes/email");
const analytics_1 = require("./routes/analytics");
const uniqueCountService_1 = require("./services/uniqueCountService");
const redis_1 = require("./routes/redis");
const redisManager_1 = __importDefault(require("./lib/redisManager"));
const env_2 = require("./config/env");
const chapterWise_1 = require("./routes/chapterWise");
const user_1 = require("./routes/user");
const app = (0, express_1.default)();
const port = env_1.PORT || 3000;
// ==========================================
// 1. MIDDLEWARES
// ==========================================
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
}));
// ==========================================
// 2. HEALTH CHECK
// ==========================================
app.use("/health", function (req, res) {
    res.status(200).json(new ApiResponse_1.default("Server is running good", "ok"));
});
// ==========================================
// 3. API ROUTES
// ==========================================
app.use("/api/auth", auth_1.authRoutes);
app.use("/api/subject", subject_1.subjectRoutes);
app.use("/api/exam", exam_1.examRoutes);
app.use("/api/chapter", chapter_1.chapterRoutes);
app.use("/api/paper", paper_1.paperRoutes);
app.use("/api/question", question_1.questionRoutes);
app.use("/api/testStatus", testStatus_1.testStatusRoutes);
app.use("/api/email", email_1.emailRoutes);
app.use("/api/analytics", analytics_1.analyticsRoutes);
app.use("/api/redis", redis_1.adminRedisRoutes);
app.use("/api/chapterWise", chapterWise_1.chapterWiseRoutes);
app.use("/api/user", user_1.userRoutes);
// --- SEARCH API (For Frontend Autocomplete) ---
app.post("/api/search/chapter", async (req, res) => {
    try {
        const { query } = req.body; // e.g. { "query": "questions about torque" }
        if (!query)
            return res.status(400).json({ error: "Query is required" });
        // Uses Vector + Keyword Search
        const results = await similarity_1.searchEngine.findChapter(query);
        return res.json({
            success: true,
            matches: results.map((r) => ({
                chapterName: r.name,
                subject: r.subject,
                chapterSlug: r.slug,
                confidence: r.score,
                details: r.matchDetails, // { vector: "0.85", keyword: "1.00", ... }
            })),
        });
    }
    catch (error) {
        console.error("Search failed:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
// ==========================================
// 4. SERVER STARTUP
// ==========================================
const startServer = async () => {
    try {
        // A. Connect to Infrastructure
        console.log("🔌 Connecting to RabbitMQ...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        // B. Initialize AI Search Engine
        // This pre-loads the "Syllabus Data" and calculates embeddings
        // so the question upload service works instantly.
        console.log("🧠 Initializing Hybrid Search Engine...");
        await similarity_1.searchEngine.initialize();
        console.log("💍 Initializing Standard Redis Clusters from .env...");
        if (env_2.REDIS_HOST) {
            await redisManager_1.default.addDashboardInstances([
                { host: env_2.REDIS_HOST, port: Number(env_2.REDIS_PORT), username: env_2.REDIS_USERNAME, password: env_2.REDIS_PASSWORD, email: '' }
            ]);
            await redisManager_1.default.addAuthInstances([
                { host: env_2.REDIS_HOST, port: Number(env_2.REDIS_PORT), username: env_2.REDIS_USERNAME, password: env_2.REDIS_PASSWORD, email: '' }
            ]);
        }
        await uniqueCountService_1.questionBitmapRegistry.load();
        // D. Start HTTP Server
        app.listen(port, () => {
            console.log(`🚀 API Server is running on port ${port}`);
            console.log(`   - Search Engine: Ready`);
            console.log(`   - Streak Cron:   Active (00:05 AM)`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start API server:", error);
        process.exit(1);
    }
};
startServer();
