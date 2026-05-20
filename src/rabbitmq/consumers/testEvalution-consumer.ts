import { Channel, ConsumeMessage } from "amqplib";
import { testStatus } from "../../repositories/testStatus.db";
import { testSyncService } from "../../services/testSyncService";

export class UpdateFinalEvaluationConsumer {
    private connection: any;

    constructor(connection: any) {
        this.connection = connection;
    }

    async start() {
        try {
            const channel      = await this.connection.getChannel();
            const exchangeName = "main_exchange";
            const queueName    = "testEvalution_queue";
            const routingKey   = "TestEvaluation.it";

            await channel.assertExchange(exchangeName, "direct", { durable: true });
            await channel.assertQueue(queueName, { durable: true });
            await channel.bindQueue(queueName, exchangeName, routingKey);

            console.log("Test Evaluation Consumer waiting for messages...");

            channel.prefetch(1);
            channel.consume(queueName, async (msg: ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const data = JSON.parse(msg.content.toString());
                    console.log(`Processing Test Evaluation for student: ${data.studentId}`);

                    // Step 1: Save all question verdicts to DB, mark test COMPLETED
                    await testStatus.finalSubmitTest(
                        data.testId,
                        data.studentId,
                        data.created_at,
                        data.report,
                    );

                    // Step 2: Build SummaryReport from saved DB data →
                    // persist to testAttemptSummary + all analytics tables →
                    // clean up Redis (DB is now source of truth)
                    await testSyncService.syncAfterSubmission(
                        data.testId,
                        data.studentId,
                    );

                    // Only ack AFTER both steps succeed
                    channel.ack(msg);
                    console.log(`Test ${data.testId} fully evaluated and synced`);

                } catch (err) {
                    console.error("Processing failed for Test Evaluation:", err);
                    // nack without requeue — prevents infinite retry loop on bad data
                    channel.nack(msg, false, false);
                }
            });

        } catch (error: any) {
            console.error("Error in TestEvaluation Consumer:", error);
            throw error;
        }
    }
}