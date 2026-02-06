import express from "express"; 
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";

import {  EVALUATION_WORKER_PORT } from "../config/env";
import { UpdateFinalEvaluationConsumer } from "../rabbitmq/consumers/testEvalution-consumer";

const testEvaluationWorker = async () => {
    try {
        console.log("📧 Starting Test Evalution Worker Service...");

        await rabbitMQClient.connect();

        // 2. Start the Consumer
        const updateFinalEvaluation = new UpdateFinalEvaluationConsumer(rabbitMQClient);
        await updateFinalEvaluation.start();
        
        console.log("✅ Evalution Worker is now listening for messages...");

      
        const app = express();
     
        const port = EVALUATION_WORKER_PORT || 3006; 

     
        app.get("/health", (req:any, res:any) => {
            res.send("Evaluation Worker is Running 🚀");
        });

        app.listen(port, () => {
            console.log(`❤️ Health check server listening on port ${port}`);
        });
        

        
        process.on("SIGTERM", async () => {
            console.log("🛑 SIGTERM received. Closing...");
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ Evaluation Worker failed to start:", error);
        process.exit(1);
    }
};

testEvaluationWorker() ;