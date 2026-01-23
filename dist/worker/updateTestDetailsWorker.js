"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rabbitmq_connection_1 = require("../rabbitmq/connection/rabbitmq-connection");
const updateTestDetails_consumer_1 = require("../rabbitmq/consumers/updateTestDetails-consumer");
const env_1 = require("../config/env");
const startUpdateWorker = async () => {
    try {
        console.log("🔄 Starting Update Test Details Worker Service...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        const updateConsumer = new updateTestDetails_consumer_1.UpdateTestDetailsConsumer(rabbitmq_connection_1.rabbitMQClient);
        await updateConsumer.start();
        console.log("✅ Update Worker is now listening for messages...");
        const app = (0, express_1.default)();
        const port = env_1.UPDATE_WORKER_PORT || 3002;
        app.get("/health", (req, res) => {
            res.send("Update Test Worker is Running 📊");
        });
        app.listen(port, () => {
            console.log(`❤️ Health check server listening on port ${port}`);
        });
        process.on("SIGTERM", async () => {
            console.log("🛑 SIGTERM received. Closing Update Worker...");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("❌ Update Worker failed to start:", error);
        process.exit(1);
    }
};
startUpdateWorker();
