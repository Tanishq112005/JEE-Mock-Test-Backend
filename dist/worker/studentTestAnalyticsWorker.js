"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rabbitmq_connection_1 = require("../rabbitmq/connection/rabbitmq-connection");
const env_1 = require("../config/env");
const studentTestAnalytics_consumer_1 = require("../rabbitmq/consumers/studentTestAnalytics-consumer");
const studentTestAnalyticsWorker = async () => {
    try {
        console.log("📧 Starting Student Test Analytics Worker Service...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        // 2. Start the Consumer
        const studentTestAnalytics = new studentTestAnalytics_consumer_1.StudentTestAnanlyticsConsumer(rabbitmq_connection_1.rabbitMQClient);
        await studentTestAnalytics.start();
        console.log("✅ Student Test Analytics  Worker is now listening for messages...");
        const app = (0, express_1.default)();
        const port = env_1.STUDENT_TEST_ANALYTICS_WORKER_PORT || 3006;
        app.get("/health", (req, res) => {
            res.send("Student Test Analytics Worker is Running 🚀");
        });
        app.listen(port, () => {
            console.log(`❤️ Health check server listening on port ${port}`);
        });
        process.on("SIGTERM", async () => {
            console.log("🛑 SIGTERM received. Closing...");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("❌Student Test Analytics  Worker failed to start:", error);
        process.exit(1);
    }
};
studentTestAnalyticsWorker();
