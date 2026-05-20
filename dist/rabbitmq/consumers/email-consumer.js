"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConsumer = void 0;
const email_1 = require("../../utils/email");
class EmailConsumer {
    rabbitMQ;
    constructor(rabbitMQ) {
        this.rabbitMQ = rabbitMQ;
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
                    data.retryCount = data.retryCount || 0;
                    console.log(`Email job received via Exchange (retry #${data.retryCount}):`, data);
                    await email_1.emailSender.send(data);
                    channel.ack(msg);
                    console.log("Email sent and acknowledged");
                }
                catch (err) {
                    console.error("Processing failed", err);
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
