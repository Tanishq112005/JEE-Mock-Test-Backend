import express from "express";
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";
import { SubmitChapterAttemptConsumer } from "../rabbitmq/consumers/submitChapterAttempt-consumer";
import redisManager from "../lib/redisManager";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD,   SUBMIT_CHAPTER_WISE_PORT } from "../config/env";
import { questionBitmapRegistry } from "../services/uniqueCountService";

const startSubmitChapterWorker = async () => {
  try {
    console.log("Starting Submit Chapter Attempt Worker Service...");

    await rabbitMQClient.connect();

    // Initialise the Dashboard Redis ring so cacheService works in this worker process
    if (REDIS_HOST) {
      await redisManager.addDashboardInstances([
        { type: 2, url: REDIS_HOST as string, email: '' } as any
      ]);
    }

    // Load the bitmap registry so questionBitmapRegistry.markAttempted() works
    await questionBitmapRegistry.load();

    const submitConsumer = new SubmitChapterAttemptConsumer(rabbitMQClient);
    await submitConsumer.start();

    console.log("Submit Chapter Worker is now listening for messages...");

    const app = express();
    const port = SUBMIT_CHAPTER_WISE_PORT || 3000; // Hardcoded fallback or use env

    app.get("/health", (req: any, res: any) => {
      res.send("Submit Chapter Worker is Running");
    });

    app.listen(port, () => {
      console.log(`Health check server listening on port ${port}`);
    });

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Closing Submit Chapter Worker...");
      process.exit(0);
    });
  } catch (error) {
    console.error("Submit Chapter Worker failed to start:", error);
    process.exit(1);
  }
};

startSubmitChapterWorker();
