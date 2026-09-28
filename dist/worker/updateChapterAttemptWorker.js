"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rabbitmq_connection_1 = require("../rabbitmq/connection/rabbitmq-connection");
const updateChapterAttempt_consumer_1 = require("../rabbitmq/consumers/updateChapterAttempt-consumer");
const redisManager_1 = __importDefault(require("../lib/redisManager"));
const env_1 = require("../config/env");
const startUpdateChapterWorker = async () => {
    try {
        console.log("Starting Update Chapter Attempt Worker Service...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        // Initialise the Dashboard Redis ring so cacheService works in this worker process
        if (env_1.REDIS_HOST) {
            await redisManager_1.default.addDashboardInstances([
                { type: 2, url: env_1.REDIS_HOST, email: '' }
            ]);
        }
        const updateConsumer = new updateChapterAttempt_consumer_1.UpdateChapterAttemptConsumer(rabbitmq_connection_1.rabbitMQClient);
        await updateConsumer.start();
        console.log("Update Chapter Worker is now listening for messages...");
        const app = (0, express_1.default)();
        const port = 3008; // Hardcoded fallback or use env
        app.get("/health", (req, res) => {
            res.send("Update Chapter Worker is Running");
        });
        app.listen(port, () => {
            console.log(`Health check server listening on port ${port}`);
        });
        process.on("SIGTERM", async () => {
            console.log("SIGTERM received. Closing Update Chapter Worker...");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("Update Chapter Worker failed to start:", error);
        process.exit(1);
    }
};
startUpdateChapterWorker();
