"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const ApiResponse_1 = __importDefault(require("./utils/ApiResponse"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = require("./routes/auth");
const rabbitmq_connection_1 = require("./rabbitmq/connection/rabbitmq-connection");
const subject_1 = require("./routes/subject");
const exam_1 = require("./routes/exam");
const chapter_1 = require("./routes/chapter");
const paper_1 = require("./routes/paper");
const question_1 = require("./routes/question");
const chapterNameService_1 = require("./services/chapterNameService");
const testStatus_1 = require("./routes/testStatus");
const app = (0, express_1.default)();
const port = env_1.PORT || 3000;
// 1. Middlewares
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
    optionsSuccessStatus: 200
}));
// 2. Health Check
app.use("/health", function (req, res) {
    res.status(200).json(new ApiResponse_1.default("Server is running good", "ok"));
});
// 3. Register Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/subject', subject_1.subjectRoutes);
app.use('/api/exam', exam_1.examRoutes);
app.use('/api/chapter', chapter_1.chapterRoutes);
app.use('/api/paper', paper_1.paperRoutes);
app.use('/api/question', question_1.questionRoutes);
app.use('/api/testStatus', testStatus_1.testStatusRoutes);
// 4. Start API Server
const startServer = async () => {
    try {
        console.log("🔌 Connecting to RabbitMQ (Producer Mode)...");
        // We connect so we can SEND emails/analytics events, but we don't start consumers here
        await rabbitmq_connection_1.rabbitMQClient.connect();
        await (0, chapterNameService_1.initializeChapterEmbeddings)();
        app.listen(port, () => {
            console.log(`🚀 API Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start API server:", error);
        process.exit(1);
    }
};
startServer();
