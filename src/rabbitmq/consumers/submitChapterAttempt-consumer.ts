import { ConsumeMessage } from "amqplib";
import { chapterWisePractice } from "../../repositories/chapterWisePractice.db";
import { chapterWiseCacheService } from "../../services/chapterWiseCacheService";
import { questionBitmapRegistry } from "../../services/uniqueCountService";

export class SubmitChapterAttemptConsumer {
  private connection: any;

  constructor(connection: any) {
    this.connection = connection;
  }

  async start() {
    try {
      const channel = await this.connection.getChannel();
      const exchangeName = "main_exchange";
      const queueName = "submitChapterAttempt_queue";
      const routingKey = "SubmitChapterAttempt.submit.it";

      await channel.assertExchange(exchangeName, "direct", { durable: true });
      await channel.assertQueue(queueName, { durable: true });
      await channel.bindQueue(queueName, exchangeName, routingKey);

      console.log("🔄 SubmitChapterAttempt Consumer waiting for messages...");

      channel.prefetch(1);
      channel.consume(queueName, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const data = JSON.parse(msg.content.toString());

          console.log(`📥 Processing Chapter Attempt Final Submit for User: ${data.studentId}`);

          // --- ACTUAL WORKER LOGIC ---
          await chapterWisePractice.saveQuestionAttempt({
              studentId: data.studentId,
              questionId: data.questionId,
              status: data.status,
              timeSpent: data.timeSpent,
              userAnswer: data.userAnswer,
              isCorrect: data.isCorrect,
              marksObtained: data.marksObtained,
              isFinalSubmit: true
          });

      

          // DB confirmed — now safe to delete from Redis
          await chapterWiseCacheService.deleteAttemptData(
            data.studentId,
            data.questionId
          );

          // We should also trigger analytics evaluation for chapter wise practice here if needed
          // For now, it's just saved in DB for the analytics worker to pick up eventually 

          channel.ack(msg);
          console.log("✅ Chapter Submit Processed Successfully");
        } catch (err) {
          console.error("❌ Processing failed for Chapter Submit:", err);
          channel.nack(msg, false, false);
        }
      });
    } catch (error: any) {
      console.error("❌ Error in SubmitChapterAttemptConsumer:", error);
      throw error;
    }
  }
}
