import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env";
import ApiResponse from "./utils/ApiResponse";

// --- ROUTES ---
import { authRoutes } from "./routes/auth";
import { subjectRoutes } from "./routes/subject";
import { examRoutes } from "./routes/exam";
import { chapterRoutes } from "./routes/chapter";
import { paperRoutes } from "./routes/paper";
import { questionRoutes } from "./routes/question";
import { testStatusRoutes } from "./routes/testStatus";

// --- SERVICES & JOBS ---
import { rabbitMQClient } from "./rabbitmq/connection/rabbitmq-connection";

import { searchEngine } from "./utils/similarity"; // 2. Hybrid Search Engine
import { seedDatabase } from "./scripts/seedChapter";
import { emailRoutes } from "./routes/email";
import { analyticsRoutes } from "./routes/analytics";
import { questionBitmapRegistry } from "./services/uniqueCountService";
import { adminRedisRoutes } from "./routes/redis";
import redisManager from "./lib/redisManager";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "./config/env";
import { chapterWiseRoutes } from "./routes/chapterWise";
import { userRoutes } from "./routes/user";
import { bookMarkedRoutes } from "./routes/bookMarked";

const app = express();
const port = PORT;

// ==========================================
// 1. MIDDLEWARES
// ==========================================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// ==========================================
// 2. HEALTH CHECK
// ==========================================
app.use("/health", function (req: Request, res: Response) {
  res.status(200).json(new ApiResponse("Server is running good", "ok"));
});

// ==========================================
// 3. API ROUTES

// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/chapter", chapterRoutes);
app.use("/api/paper", paperRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/testStatus", testStatusRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/redis", adminRedisRoutes);
app.use("/api/chapterWise" , chapterWiseRoutes) ; 
app.use("/api/user" , userRoutes) ; 
app.use("/api/bookMarked" , bookMarkedRoutes) ; 
// --- SEARCH API (For Frontend Autocomplete) ---
app.post(
  "/api/search/chapter",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { query } = req.body; // e.g. { "query": "questions about torque" }

      if (!query) return res.status(400).json({ error: "Query is required" });

      // Uses Vector + Keyword Search
      const results = await searchEngine.findChapter(query);

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
    } catch (error) {
      console.error("Search failed:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// ==========================================
// 4. SERVER STARTUP
// ==========================================
const startServer = async () => {
  try {
    // A. Connect to Infrastructure
    console.log("🔌 Connecting to RabbitMQ...");
    await rabbitMQClient.connect();

    // B. Initialize AI Search Engine
    // This pre-loads the "Syllabus Data" and calculates embeddings
    // so the question upload service works instantly.
    console.log("🧠 Initializing Hybrid Search Engine...");
    await searchEngine.initialize();

    console.log("💍 Initializing Standard Redis Clusters from .env...");
    if (REDIS_HOST) {
        await redisManager.addDashboardInstances([
          { host: REDIS_HOST as string, port: Number(REDIS_PORT), username: REDIS_USERNAME as string, password: REDIS_PASSWORD as string, email: '' } as any
        ]);
        await redisManager.addAuthInstances([
          { host: REDIS_HOST as string, port: Number(REDIS_PORT), username: REDIS_USERNAME as string, password: REDIS_PASSWORD as string, email: '' } as any
        ]);
    }

    await questionBitmapRegistry.load();

    // D. Start HTTP Server
    app.listen(port, () => {
      console.log(`🚀 API Server is running on port ${port}`);
      console.log(`   - Search Engine: Ready`);
      console.log(`   - Streak Cron:   Active (00:05 AM)`);
    });
  } catch (error) {
    console.error("❌ Failed to start API server:", error);
    process.exit(1);
  }
};

startServer();
