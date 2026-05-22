"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConsumer = void 0;
const notificationBuilder_1 = require("../../interfaces/notificationBuilder");
class EmailConsumer {
    rabbitMQ;
    emailService;
    constructor(rabbitMQ, emailService) {
        this.rabbitMQ = rabbitMQ;
        this.emailService = emailService;
    }
    async start() {
        try {
            const channel = await this.rabbitMQ.getChannel();
            const exchangeName = "main_exchange";
            await channel.assertExchange(exchangeName, "direct", { durable: true });
            const queueName = "email_queue";
            await channel.assertQueue(queueName, { durable: true });
            await channel.assertQueue("email_queue_dead", { durable: true });
            const routingKey = "email.send";
            await channel.bindQueue(queueName, exchangeName, routingKey);
            console.log("Email Consumer started... Waiting for messages...");
            channel.consume(queueName, async (msg) => {
                if (!msg)
                    return;
                try {
                    let data = JSON.parse(msg.content.toString());
                    const rawMessage = data.message ? data.message : data;
                    if (!rawMessage.toEmail && !rawMessage.toPhone) {
                        console.warn("⚠️ Found invalid/old message missing email/phone. Deleting from queue. Data was:", data);
                        channel.ack(msg);
                        return;
                    }
                    data.retryCount = data.retryCount || 0;
                    console.log(`Email job received via Exchange (retry #${data.retryCount}):`, data);
                    const message = new notificationBuilder_1.NotificationBuilder()
                        .fromJSON(data)
                        .build();
                    await this.emailService.send(message);
                    channel.ack(msg);
                    console.log("✅ Email sent and acknowledged");
                }
                catch (err) {
                    console.error("Processing failed:", err);
                    channel.nack(msg, false, false);
                }
            });
        }
        catch (err) {
            console.error("Error starting Email Consumer:", err);
            throw err;
        }
    }
}
exports.EmailConsumer = EmailConsumer;
