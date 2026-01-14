import express from "express";
import cors from "cors";
import { PORT } from "./config/env";
import { Request, Response } from "express";
import ApiResponse from "./utils/ApiResponse";
import cookieParser from 'cookie-parser';
import { authRoutes } from "./routes/auth";
import { EmailConsumer } from "./rabbitmq/consumers/email-consumer";
import { rabbitMQClient } from "./rabbitmq/connection/rabbitmq-connection";
import { subjectRoutes } from "./routes/subject";
import { examRoutes } from "./routes/exam";
import { chapterRoutes } from "./routes/chapter";
import { paperRoutes } from "./routes/paper";
import { questionRoutes } from "./routes/question";
import { initializeChapterEmbeddings } from "./services/chapterNameService";
// import { seedChapters } from "./services/scripts";

const app = express();
const port = PORT || 3000;

// 1. Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// 2. Health Check
app.use("/health", function (req: Request, res: Response) {
    res.status(200).json(
        new ApiResponse("Server is running good", "ok")
    );
});

// 3. Register Routes (MUST be before app.listen)
app.use('/api/auth', authRoutes);
app.use('/api/subject', subjectRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/chapter', chapterRoutes);
app.use('/api/paper', paperRoutes);
app.use('/api/question', questionRoutes);

// 4. Start Server Function (The ONLY place app.listen should exist)
const startServer = async () => {
    try {
        console.log("🔌 Connecting to RabbitMQ...");
        await rabbitMQClient.connect();

        console.log("👷 Starting Email Worker...");
        const emailConsumer = new EmailConsumer(rabbitMQClient);
        await emailConsumer.start();
        console.log("✅ Email Worker is running in background.");
        await initializeChapterEmbeddings() ; 
        // Only start listening AFTER DB/Queue connections are ready
        app.listen(port, () => {
            console.log(`🚀 Server is running on port ${port}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1); // Exit process on failure so Render tries to restart cleanly
    }
};

startServer();