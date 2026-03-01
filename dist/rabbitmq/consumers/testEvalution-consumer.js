"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFinalEvaluationConsumer = void 0;
const testStatus_db_1 = require("../../repositories/testStatus.db");
const testSyncService_1 = require("../../services/testSyncService");
class UpdateFinalEvaluationConsumer {
    connection;
    constructor(connection) {
        this.connection = connection;
    }
    async start() {
        try {
            const channel = await this.connection.getChannel();
            const exchangeName = "main_exchange";
            const queueName = "testEvalution_queue";
            const routingKey = "TestEvaluation.it";
            await channel.assertExchange(exchangeName, "direct", { durable: true });
            await channel.assertQueue(queueName, { durable: true });
            await channel.bindQueue(queueName, exchangeName, routingKey);
            console.log("🔄 Test Evaluation Consumer waiting for messages...");
            channel.prefetch(1);
            channel.consume(queueName, async (msg) => {
                if (!msg)
                    return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    console.log(`📥 Processing Test Evaluation for student: ${data.studentId}`);
                    // Step 1: Save all question verdicts to DB, mark test COMPLETED
                    await testStatus_db_1.testStatus.finalSubmitTest(data.testId, data.studentId, data.created_at, data.report);
                    // Step 2: Build SummaryReport from saved DB data →
                    // persist to testAttemptSummary + all analytics tables →
                    // clean up Redis (DB is now source of truth)
                    await testSyncService_1.testSyncService.syncAfterSubmission(data.testId, data.studentId);
                    // Only ack AFTER both steps succeed
                    channel.ack(msg);
                    console.log(`✅ Test ${data.testId} fully evaluated and synced`);
                }
                catch (err) {
                    console.error("❌ Processing failed for Test Evaluation:", err);
                    // nack without requeue — prevents infinite retry loop on bad data
                    channel.nack(msg, false, false);
                }
            });
        }
        catch (error) {
            console.error("❌ Error in TestEvaluation Consumer:", error);
            throw error;
        }
    }
}
exports.UpdateFinalEvaluationConsumer = UpdateFinalEvaluationConsumer;
