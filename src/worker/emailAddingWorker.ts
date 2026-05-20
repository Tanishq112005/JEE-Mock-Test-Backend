import express from "express"; 
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";
import { EmailAddingConsumer } from "../rabbitmq/consumers/emailAdding-consumer";
import { EMAIL_ADDING_WORKER_PORT } from "../config/env";

const startEmailAddingWorker = async () => {
    try {
        console.log("Starting Email Adding Worker Service...");

        await rabbitMQClient.connect();

        // 2. Start the Consumer
        const emailAddingConsumer = new EmailAddingConsumer(rabbitMQClient) ; 
        await emailAddingConsumer.start() ; 
        
        console.log("Email Adding Worker is now listening for messages...");

      
        const app = express();
     
        const port = EMAIL_ADDING_WORKER_PORT || 3001; 

     
        app.get("/health", (req: any , res:any) => {
            res.send("Email Adding Worker is Running");
        });

        app.listen(port, () => {
            console.log(`Health check server listening on port ${port}`);
        });
        

        
        process.on("SIGTERM", async () => {
            console.log("SIGTERM received. Closing...");
            process.exit(0);
        });

    } catch (error) {
        console.error("Email Adding Worker failed to start:", error);
        process.exit(1);
    }
};

startEmailAddingWorker();