"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakConsumer = void 0;
const analytics_db_1 = require("../../repositories/analytics.db");
class StreakConsumer {
    rabbitMQ;
    constructor(rabbitMQ) {
        this.rabbitMQ = rabbitMQ;
    }
    async start() {
        try {
            const channel = await this.rabbitMQ.getChannel();
            const exchangeName = "main_exchange";
            await channel.assertExchange(exchangeName, "direct", { durable: true });
            const queueName = "streak_update_queue";
            await channel.assertQueue(queueName, { durable: true });
            await channel.assertQueue("streak_update_queue_dead", { durable: true });
            await channel.bindQueue(queueName, exchangeName, "streak.update");
            await channel.bindQueue(queueName, exchangeName, "streak.reset");
            console.log("Streak Consumer started... Waiting for messages...");
            channel.consume(queueName, async (msg) => {
                if (!msg)
                    return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    const routingKey = msg.fields.routingKey;
                    if (data.studentId) {
                        if (routingKey === "streak.reset") {
                            await analytics_db_1.analytics.resetStreak(data.studentId);
                        }
                        else {
                            // streak.update
                            await analytics_db_1.analytics.updateStreak(data.studentId, data.currentStreak, data.maxStreak);
                        }
                    }
                    channel.ack(msg);
                }
                catch (err) {
                    console.error("[Streak Consumer] Processing failed", err);
                    channel.nack(msg, false, false);
                }
            });
        }
        catch (err) {
            console.error("Error starting Streak Consumer:", err);
            throw err;
        }
    }
}
exports.StreakConsumer = StreakConsumer;
