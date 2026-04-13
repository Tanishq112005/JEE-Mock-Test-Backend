import { Channel, ConsumeMessage } from "amqplib";
import { testStatus } from "../../repositories/testStatus.db";
import { dashboardCacheService } from "../../services/dashboardCacheService";

export class UpdateTestDetailsConsumer {
  private connection: any;

  constructor(connection: any) {
    this.connection = connection;
  }

  async start() {
    try {
      const channel = await this.connection.getChannel();
      const exchangeName = "main_exchange";
      const queueName = "updateTestDetails_queue";
      const routingKey = "UpdateTestDetails.update.it";

      // 1. Assert Exchange
      await channel.assertExchange(exchangeName, "direct", { durable: true });

      // 2. Assert Queue
      await channel.assertQueue(queueName, { durable: true });

      // 3. Bind Queue to Exchange with specific Routing Key
      // This is CRITICAL: It tells RabbitMQ "Only put messages with key 'UpdateTestDetails.update.it' in this queue"
      await channel.bindQueue(queueName, exchangeName, routingKey);

      console.log("🔄 UpdateTestDetails Consumer waiting for messages...");

      // 4. Consume
      channel.prefetch(1);
      channel.consume(queueName, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const data = JSON.parse(msg.content.toString());

          console.log(`📥 Processing Test Update for User: ${data.userId}`);

          // --- ACTUAL WORKER LOGIC ---
          await testStatus.updatingTestDetails(data);
          // ---------------------------

          // ── DB confirmed — now safe to delete from Redis ───
          await dashboardCacheService.deleteTestUpdateData(
            data.userId,
            data.testId,
          );

          channel.ack(msg);
          console.log("✅ Test Data Updated Successfully");
        } catch (err) {
          console.error("❌ Processing failed for Test Update:", err);

          // NACK: false, false -> This rejects the message and DROPS it (does not requeue)
          // If you want to retry later, change the second 'false' to 'true'
          // Redis is NOT deleted on failure — cache stays intact for frontend
          channel.nack(msg, false, false);
        }
      });
    } catch (error: any) {
      console.error("❌ Error in UpdateTestDetailsConsumer:", error);
      throw error;
    }
  }
}
