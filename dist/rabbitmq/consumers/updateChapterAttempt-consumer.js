"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChapterAttemptConsumer = void 0;
const chapterWisePractice_db_1 = require("../../repositories/chapterWisePractice.db");
const chapterWiseCacheService_1 = require("../../services/chapterWiseCacheService");
class UpdateChapterAttemptConsumer {
    connection;
    constructor(connection) {
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
            console.log("UpdateChapterAttempt Consumer waiting for messages...");
            channel.prefetch(1);
            channel.consume(queueName, async (msg) => {
                if (!msg)
                    return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    console.log(`Processing Chapter Attempt Update for User: ${data.studentId}`);
                    // --- ACTUAL WORKER LOGIC ---
                    await chapterWisePractice_db_1.chapterWisePractice.saveQuestionAttempt({
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
                    await chapterWiseCacheService_1.chapterWiseCacheService.deleteAttemptData(data.studentId, data.questionId);
                    channel.ack(msg);
                    console.log("Chapter Update Processed Successfully");
                }
                catch (err) {
                    console.error("Processing failed for Chapter Update:", err);
                    channel.nack(msg, false, false);
                }
            });
        }
        catch (error) {
            console.error("Error in UpdateChapterAttemptConsumer:", error);
            throw error;
        }
    }
}
exports.UpdateChapterAttemptConsumer = UpdateChapterAttemptConsumer;
