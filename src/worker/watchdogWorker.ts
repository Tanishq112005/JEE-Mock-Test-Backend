import express from "express";
import { testStatus } from "../repositories/testStatus.db";
import { WATCHDOG_INACTIVITY_THRESHOLD_SEC, WATCHDOG_INTERVAL, WATCHDOG_PORT } from "../config/env"; 


const CHECK_INTERVAL_MS = parseInt(WATCHDOG_INTERVAL || '60000'); 
const INACTIVITY_THRESHOLD_SEC = parseInt(WATCHDOG_INACTIVITY_THRESHOLD_SEC || '90');

import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";
import { StreakConsumer } from "../rabbitmq/consumers/streak-consumer";

const startWatchdogWorker = async () => {
    try {
        await rabbitMQClient.connect();
        const streakConsumer = new StreakConsumer(rabbitMQClient);
        await streakConsumer.start();
        
        const intervalId = setInterval(async () => {
            try {
               
                await testStatus.autoPauseInactiveTests(INACTIVITY_THRESHOLD_SEC);
            } catch (err) {
                console.error("Watchdog failed this cycle:", err);
                
            }
        }, CHECK_INTERVAL_MS);

        

      
        const app = express();
        const port = WATCHDOG_PORT || 3003;

        app.get("/health", (req: any , res:any) => {
            res.send("Watchdog is guarding");
        });

        app.listen(port, () => {
            console.log(`Watchdog Health check listening on port ${port}`);
        });

     
        process.on("SIGTERM", () => {
            console.log("SIGTERM received. Stopping Watchdog...");
            clearInterval(intervalId); 
            process.exit(0);
        });

    } catch (error) {
        console.error("Watchdog failed to start:", error);
        process.exit(1);
    }
};

startWatchdogWorker();