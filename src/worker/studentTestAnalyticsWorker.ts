import express from "express"; 
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";

import {   STUDENT_TEST_ANALYTICS_WORKER_PORT } from "../config/env";

import { StudentTestAnanlyticsConsumer } from "../rabbitmq/consumers/studentTestAnalytics-consumer";

const studentTestAnalyticsWorker = async () => {
    try {
        console.log("📧 Starting Student Test Analytics Worker Service...");

        await rabbitMQClient.connect();

        // 2. Start the Consumer
        const studentTestAnalytics = new StudentTestAnanlyticsConsumer(rabbitMQClient);
        await studentTestAnalytics.start();
        
        console.log("✅ Student Test Analytics  Worker is now listening for messages...");

      
        const app = express();
     
        const port = STUDENT_TEST_ANALYTICS_WORKER_PORT || 3006; 

     
        app.get("/health", (req, res) => {
            res.send("Student Test Analytics Worker is Running 🚀");
        });

        app.listen(port, () => {
            console.log(`❤️ Health check server listening on port ${port}`);
        });
        

        
        process.on("SIGTERM", async () => {
            console.log("🛑 SIGTERM received. Closing...");
            process.exit(0);
        });

    } catch (error) {
        console.error("❌Student Test Analytics  Worker failed to start:", error);
        process.exit(1);
    }
};

studentTestAnalyticsWorker() ;