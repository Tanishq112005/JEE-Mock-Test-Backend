"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitChapterAttemptConsumer = void 0;
const chapterWisePractice_db_1 = require("../../repositories/chapterWisePractice.db");
const analytics_db_1 = require("../../repositories/analytics.db");
const chapterWiseCacheService_1 = require("../../services/chapterWiseCacheService");
class SubmitChapterAttemptConsumer {
    connection;
    constructor(connection) {
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
            console.log("SubmitChapterAttempt Consumer waiting for messages...");
            channel.prefetch(1);
            channel.consume(queueName, async (msg) => {
                if (!msg)
                    return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    console.log(`Processing Chapter Attempt Final Submit for User: ${data.studentId}`);
                    // --- ACTUAL WORKER LOGIC ---
                    await chapterWisePractice_db_1.chapterWisePractice.saveQuestionAttempt({
                        studentId: data.studentId,
                        questionId: data.questionId,
                        status: data.status,
                        timeSpent: data.timeSpent,
                        userAnswer: data.userAnswer,
                        isCorrect: data.isCorrect,
                        marksObtained: data.marksObtained,
                        isFinalSubmit: true
                    });
                    if (data.subjectId && data.type) {
                        await analytics_db_1.analytics.persistPracticeAnalytics(data.studentId, data.subjectId, {
                            questionId: data.questionId,
                            verdict: data.verdict ?? (data.isCorrect ? "correct" : "wrong"),
                            marks: data.marksObtained ?? 0,
                            positiveMarks: data.positiveMarks ?? 0,
                            type: data.type,
                            timeSpent: data.timeSpent ?? 0,
                            userAnswer: data.userAnswer ?? [],
                            isVisited: true,
                            chapterId: data.chapterId ?? null,
                            examName: data.examName ?? null,
                        }, { persistAttemptRecord: false });
                    }
                    // DB confirmed — now safe to delete from Redis
                    await chapterWiseCacheService_1.chapterWiseCacheService.deleteAttemptData(data.studentId, data.questionId);
                    // We should also trigger analytics evaluation for chapter wise practice here if needed
                    // For now, it's just saved in DB for the analytics worker to pick up eventually 
                    channel.ack(msg);
                    console.log("Chapter Submit Processed Successfully");
                }
                catch (err) {
                    console.error("Processing failed for Chapter Submit:", err);
                    channel.nack(msg, false, false);
                }
            });
        }
        catch (error) {
            console.error("Error in SubmitChapterAttemptConsumer:", error);
            throw error;
        }
    }
}
exports.SubmitChapterAttemptConsumer = SubmitChapterAttemptConsumer;
