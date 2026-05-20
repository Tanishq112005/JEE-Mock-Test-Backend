import express from "express"; 
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";
import { EmailConsumer } from "../rabbitmq/consumers/email-consumer";
import { EMAIL_WORKER_PORT } from "../config/env";

const startEmailWorker = async () => {
    try {
        console.log("Starting Email Worker Service...");

        await rabbitMQClient.connect();

        // 2. Start the Consumer
        const emailConsumer = new EmailConsumer(rabbitMQClient);
        await emailConsumer.start();
        
        console.log("Email Worker is now listening for messages...");

      
        const app = express();
     
        const port = EMAIL_WORKER_PORT || 3001; 

     
        app.get("/health", (req: any , res:any) => {
            res.send("Email Worker is Running");
        });

        app.listen(port, () => {
            console.log(`Health check server listening on port ${port}`);
        });
        

        
        process.on("SIGTERM", async () => {
            console.log("SIGTERM received. Closing...");
            process.exit(0);
        });

    } catch (error) {
        console.error("Email Worker failed to start:", error);
        process.exit(1);
    }
};

startEmailWorker();