"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailProducer = exports.EmailProducer = void 0;
const rabbitmq_connection_1 = require("../connection/rabbitmq-connection");
class EmailProducer {
    constructor() {
    }
    async sendOtp(data) {
        try {
            const channel = await rabbitmq_connection_1.rabbitMQClient.getChannel();
            const exchange = "main_exchange";
            const routingKey = "email.send";
            await channel.assertExchange(exchange, "direct", { durable: true });
            channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), { persistent: true });
            console.log(`OTP Sent via RabbitMQ`);
        }
        catch (err) {
            console.error("Producer Error:", err);
            throw err;
        }
    }
}
exports.EmailProducer = EmailProducer;
exports.emailProducer = new EmailProducer();
