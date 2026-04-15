import { ConsumeMessage } from "amqplib";
import { chapterWisePractice } from "../../repositories/chapterWisePractice.db";
import { chapterWiseCacheService } from "../../services/chapterWiseCacheService";

export class UpdateChapterAttemptConsumer {
  private connection: any;

  constructor(connection: any) {
    this.connection = connection;
  }

  async start() {
    try {
      const channel = await this.connection.getChannel();
      const exchangeName = "main_exchange";
      const queueName = "updateChapterAttempt_queue";
      const routingKey = "UpdateChapterAttempt.update.it";

      await channel.assertExchange(exchangeName, "direct", { durable: true });
      await channel.assertQueue(queueName, { durable: true });
      await channel.bindQueue(queueName, exchangeName, routingKey);

      console.log("🔄 UpdateChapterAttempt Consumer waiting for messages...");

      channel.prefetch(1);
      channel.consume(queueName, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const data = JSON.parse(msg.content.toString());

          console.log(`📥 Processing Chapter Attempt Update for User: ${data.studentId}`);

          // --- ACTUAL WORKER LOGIC ---
          await chapterWisePractice.saveQuestionAttempt({
              studentId: data.studentId,
              questionId: data.questionId,
              status: data.status,
              timeSpent: data.timeSpent,
              userAnswer: data.userAnswer,
              isCorrect: false, // Update doesn't evaluate
              marksObtained: 0,
              isFinalSubmit: false
          });

          // DB confirmed — now safe to clear Redis.
          // Redis only holds data not yet persisted to DB.
          // Once the worker confirms the write, Redis is cleared so the next
          // heartbeat/submit writes fresh live state.
          await chapterWiseCacheService.deleteAttemptData(
            data.studentId,
            data.questionId
          );

          channel.ack(msg);
          console.log("✅ Chapter Update Processed Successfully");
        } catch (err) {
          console.error("❌ Processing failed for Chapter Update:", err);
          channel.nack(msg, false, false);
        }
      });
    } catch (error: any) {
      console.error("❌ Error in UpdateChapterAttemptConsumer:", error);
      throw error;
    }
  }
}
