import { rabbitMQClient } from '../rabbitmq/connection/rabbitmq-connection';

async function checkQueues() {
  await rabbitMQClient.connect();
  const channel = await rabbitMQClient.getChannel();
  
  const queues = [
    'email_queue',
    'updateTestDetails_queue',
    'testEvaluation_queue',
    'studentTestAnalytics_queue',
    'emailAdding_queue',
    'updateChapterAttempt_queue',
    'submitChapterAttempt_queue',
    'streak_queue'
  ];

  for (const q of queues) {
    try {
      const qStatus = await channel.assertQueue(q, { durable: true });
      console.log(`Queue: ${q} | Messages: ${qStatus.messageCount} | Consumers: ${qStatus.consumerCount}`);
    } catch (err) {
      console.error(`Error checking queue ${q}:`, err);
    }
  }

  process.exit(0);
}

checkQueues();
