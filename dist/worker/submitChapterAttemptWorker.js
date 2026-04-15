"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rabbitmq_connection_1 = require("../rabbitmq/connection/rabbitmq-connection");
const submitChapterAttempt_consumer_1 = require("../rabbitmq/consumers/submitChapterAttempt-consumer");
const redisManager_1 = __importDefault(require("../lib/redisManager"));
const env_1 = require("../config/env");
const uniqueCountService_1 = require("../services/uniqueCountService");
const startSubmitChapterWorker = async () => {
    try {
        console.log("🔄 Starting Submit Chapter Attempt Worker Service...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        // Initialise the Dashboard Redis ring so cacheService works in this worker process
        if (env_1.REDIS_HOST) {
            await redisManager_1.default.addDashboardInstances([
                { host: env_1.REDIS_HOST, port: Number(env_1.REDIS_PORT), username: env_1.REDIS_USERNAME, password: env_1.REDIS_PASSWORD, email: '' }
            ]);
        }
        // Load the bitmap registry so questionBitmapRegistry.markAttempted() works
        await uniqueCountService_1.questionBitmapRegistry.load();
        const submitConsumer = new submitChapterAttempt_consumer_1.SubmitChapterAttemptConsumer(rabbitmq_connection_1.rabbitMQClient);
        await submitConsumer.start();
        console.log("✅ Submit Chapter Worker is now listening for messages...");
        const app = (0, express_1.default)();
        const port = 3009; // Hardcoded fallback or use env
        app.get("/health", (req, res) => {
            res.send("Submit Chapter Worker is Running 📊");
        });
        app.listen(port, () => {
            console.log(`❤️ Health check server listening on port ${port}`);
        });
        process.on("SIGTERM", async () => {
            console.log("🛑 SIGTERM received. Closing Submit Chapter Worker...");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("❌ Submit Chapter Worker failed to start:", error);
        process.exit(1);
    }
};
startSubmitChapterWorker();
