"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const ApiResponse_1 = __importDefault(require("./utils/ApiResponse"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = require("./routes/auth");
const email_consumer_1 = require("./rabbitmq/consumers/email-consumer");
const rabbitmq_connection_1 = require("./rabbitmq/connection/rabbitmq-connection");
const subject_1 = require("./routes/subject");
const exam_1 = require("./routes/exam");
const chapter_1 = require("./routes/chapter");
const paper_1 = require("./routes/paper");
const question_1 = require("./routes/question");
const chapterNameService_1 = require("./services/chapterNameService");
// import { seedChapters } from "./services/scripts";
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
// 3. Register Routes (MUST be before app.listen)
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/subject', subject_1.subjectRoutes);
app.use('/api/exam', exam_1.examRoutes);
app.use('/api/chapter', chapter_1.chapterRoutes);
app.use('/api/paper', paper_1.paperRoutes);
app.use('/api/question', question_1.questionRoutes);
// 4. Start Server Function (The ONLY place app.listen should exist)
const startServer = async () => {
    try {
        console.log("🔌 Connecting to RabbitMQ...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        console.log("👷 Starting Email Worker...");
        const emailConsumer = new email_consumer_1.EmailConsumer(rabbitmq_connection_1.rabbitMQClient);
        await emailConsumer.start();
        console.log("✅ Email Worker is running in background.");
        await (0, chapterNameService_1.initializeChapterEmbeddings)();
        // Only start listening AFTER DB/Queue connections are ready
        app.listen(port, () => {
            console.log(`🚀 Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1); // Exit process on failure so Render tries to restart cleanly
    }
};
startServer();
