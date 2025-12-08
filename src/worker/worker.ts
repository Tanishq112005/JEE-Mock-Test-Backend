import { EmailConsumer } from "../rabbitmq/consumers/email-consumer"; 

import { rabbitMQClient } from "../rabbitmq/connection/rabbitmq-connection"; 

async function startWorker() {
  try {
    console.log("Starting Email Worker Service...");

    
    await rabbitMQClient.connect(); 

   
    const emailConsumer = new EmailConsumer(rabbitMQClient);

   
    await emailConsumer.start();

    console.log("Worker is running and listening for emails.");

  } catch (error) {
    console.error("Failed to start worker:", error);
    process.exit(1);
  }
}

startWorker();