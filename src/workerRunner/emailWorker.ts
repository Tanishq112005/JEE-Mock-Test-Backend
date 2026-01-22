
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";
import { EmailConsumer } from "../rabbitmq/consumers/email-consumer";

const startEmailWorker = async () => {
    try {
        console.log("📧 Starting Email Worker Service...");

        // 1. Connect to RabbitMQ
        await rabbitMQClient.connect();

        // 2. Start the Consumer
        const emailConsumer = new EmailConsumer(rabbitMQClient);
        await emailConsumer.start();
        
        console.log("✅ Email Worker is now listening for messages...");

        // Optional: Handle graceful shutdown
        process.on("SIGTERM", async () => {
            console.log("🛑 SIGTERM received. Closing RabbitMQ connection...");
            // Add your graceful shutdown logic here if needed
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ Email Worker failed to start:", error);
        process.exit(1);
    }
};

startEmailWorker();