import express from "express";
import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection";
import { UpdateChapterAttemptConsumer } from "../rabbitmq/consumers/updateChapterAttempt-consumer";
import redisManager from "../lib/redisManager";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "../config/env";

const startUpdateChapterWorker = async () => {
  try {
    console.log("Starting Update Chapter Attempt Worker Service...");

    await rabbitMQClient.connect();

    // Initialise the Dashboard Redis ring so cacheService works in this worker process
    if (REDIS_HOST) {
      await redisManager.addDashboardInstances([
        { type: 2, url: REDIS_HOST as string, email: '' } as any
      ]);
    }

    const updateConsumer = new UpdateChapterAttemptConsumer(rabbitMQClient);
    await updateConsumer.start();

    console.log("Update Chapter Worker is now listening for messages...");

    const app = express();
    const port = 3008; // Hardcoded fallback or use env

    app.get("/health", (req: any, res: any) => {
      res.send("Update Chapter Worker is Running");
    });

    app.listen(port, () => {
      console.log(`Health check server listening on port ${port}`);
    });

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Closing Update Chapter Worker...");
      process.exit(0);
    });
  } catch (error) {
    console.error("Update Chapter Worker failed to start:", error);
    process.exit(1);
  }
};

startUpdateChapterWorker();
