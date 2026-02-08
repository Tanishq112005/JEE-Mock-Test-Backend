"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rabbitmq_connection_1 = require("../rabbitmq/connection/rabbitmq-connection");
const emailAdding_consumer_1 = require("../rabbitmq/consumers/emailAdding-consumer");
const env_1 = require("../config/env");
const startEmailAddingWorker = async () => {
    try {
        console.log("📧 Starting Email Adding Worker Service...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        // 2. Start the Consumer
        const emailAddingConsumer = new emailAdding_consumer_1.EmailAddingConsumer(rabbitmq_connection_1.rabbitMQClient);
        await emailAddingConsumer.start();
        console.log("✅ Email Adding Worker is now listening for messages...");
        const app = (0, express_1.default)();
        const port = env_1.EMAIL_ADDING_WORKER_PORT || 3001;
        app.get("/health", (req, res) => {
            res.send("Email Adding Worker is Running 🚀");
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
        console.error("❌ Email Adding Worker failed to start:", error);
        process.exit(1);
    }
};
startEmailAddingWorker();
