"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentTestAnanlyticsConsumer = void 0;
const analytics_db_1 = require("../../repositories/analytics.db");
class StudentTestAnanlyticsConsumer {
    connection;
    constructor(connection) {
        this.connection = connection;
    }
    async start() {
        try {
            const channel = await this.connection.getChannel();
            const exchangeName = "main_exchange";
            const queueName = "studentTestAnalytics_queue";
            const routingKey = "studentAnalytics.update.it";
            // 1. Assert Exchange
            await channel.assertExchange(exchangeName, "direct", { durable: true });
            // 2. Assert Queue
            await channel.assertQueue(queueName, { durable: true });
            // 3. Bind Queue to Exchange with specific Routing Key
            // This is CRITICAL: It tells RabbitMQ "Only put messages with key 'UpdateTestDetails.update.it' in this queue"
            await channel.bindQueue(queueName, exchangeName, routingKey);
            console.log("🔄 Stduent Test Analytics Consumer waiting for messages...");
            // 4. Consume
            channel.prefetch(1);
            channel.consume(queueName, async (msg) => {
                if (!msg)
                    return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    console.log(`📥 Processing Student Test Analytics Update for User: ${data.studentId}`);
                    await analytics_db_1.analytics.persistTestAnalytics(data.testId, data.studentId, data.report);
                    channel.ack(msg);
                    console.log("✅ Update The Student Test Analytics  Evaluated SuccessFully");
                }
                catch (err) {
                    console.error("❌ Processing failed for  Student Test Analytics :", err);
                    channel.nack(msg, false, false);
                }
            });
        }
        catch (error) {
            console.error("❌ Error in   Student Test Analytics  Consumer:", error);
            throw error;
        }
    }
}
exports.StudentTestAnanlyticsConsumer = StudentTestAnanlyticsConsumer;
