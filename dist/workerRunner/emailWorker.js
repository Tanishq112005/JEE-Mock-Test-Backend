"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rabbitmq_connection_1 = require("../rabbitmq/connection/rabbitmq-connection");
const email_consumer_1 = require("../rabbitmq/consumers/email-consumer");
const startEmailWorker = async () => {
    try {
        console.log("📧 Starting Email Worker Service...");
        // 1. Connect to RabbitMQ
        await rabbitmq_connection_1.rabbitMQClient.connect();
        // 2. Start the Consumer
        const emailConsumer = new email_consumer_1.EmailConsumer(rabbitmq_connection_1.rabbitMQClient);
        await emailConsumer.start();
        console.log("✅ Email Worker is now listening for messages...");
        // Optional: Handle graceful shutdown
        process.on("SIGTERM", async () => {
            console.log("🛑 SIGTERM received. Closing RabbitMQ connection...");
            // Add your graceful shutdown logic here if needed
            process.exit(0);
        });
    }
    catch (error) {
        console.error("❌ Email Worker failed to start:", error);
        process.exit(1);
    }
};
startEmailWorker();
