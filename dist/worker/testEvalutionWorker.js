"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rabbitmq_connection_1 = require("../rabbitmq/connection/rabbitmq-connection");
const env_1 = require("../config/env");
const testEvalution_consumer_1 = require("../rabbitmq/consumers/testEvalution-consumer");
const redisManager_1 = __importDefault(require("../lib/redisManager"));
const env_2 = require("../config/env");
const testEvaluationWorker = async () => {
    try {
        console.log("Starting Test Evalution Worker Service...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        // 2. Initialize Redis Rings
        if (env_2.REDIS_HOST) {
            await redisManager_1.default.addDashboardInstances([
                { type: 2, url: env_2.REDIS_HOST, email: '' }
            ]);
            await redisManager_1.default.addAuthInstances([
                { type: 2, url: env_2.REDIS_HOST, email: '' }
            ]);
        }
        // 3. Start the Consumer
        const updateFinalEvaluation = new testEvalution_consumer_1.UpdateFinalEvaluationConsumer(rabbitmq_connection_1.rabbitMQClient);
        await updateFinalEvaluation.start();
        console.log("Evalution Worker is now listening for messages...");
        const app = (0, express_1.default)();
        const port = env_1.EVALUATION_WORKER_PORT || 3006;
        app.get("/health", (req, res) => {
            res.send("Evaluation Worker is Running");
        });
        app.listen(port, () => {
            console.log(`Health check server listening on port ${port}`);
        });
        process.on("SIGTERM", async () => {
            console.log("SIGTERM received. Closing...");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("Evaluation Worker failed to start:", error);
        process.exit(1);
    }
};
testEvaluationWorker();
