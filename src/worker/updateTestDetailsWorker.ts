import express from "express";
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";
import { UpdateTestDetailsConsumer } from "../rabbitmq/consumers/updateTestDetails-consumer";
import { UPDATE_WORKER_PORT } from "../config/env"; 
import redisManager from "../lib/redisManager";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "../config/env";

const startUpdateWorker = async () => {
    try {
        console.log("Starting Update Test Details Worker Service...");

      
        await rabbitMQClient.connect();

        if (REDIS_HOST) {
            await redisManager.addDashboardInstances([
                { type: 2, url: REDIS_HOST as string, email: '' } as any
            ]);
            await redisManager.addAuthInstances([
                { type: 2, url: REDIS_HOST as string, email: '' } as any
            ]);
        }

      
        const updateConsumer = new UpdateTestDetailsConsumer(rabbitMQClient);
        await updateConsumer.start();
        
        console.log("Update Worker is now listening for messages...");

     
        const app = express();
        
    
        const port = UPDATE_WORKER_PORT || 3002; 

        app.get("/health", (req: any , res:any) => {
            res.send("Update Test Worker is Running");
        });

        app.listen(port, () => {
            console.log(`Health check server listening on port ${port}`);
        });

  
        process.on("SIGTERM", async () => {
            console.log("SIGTERM received. Closing Update Worker...");
            process.exit(0);
        });

    } catch (error) {
        console.error("Update Worker failed to start:", error);
        process.exit(1);
    }
};

startUpdateWorker();