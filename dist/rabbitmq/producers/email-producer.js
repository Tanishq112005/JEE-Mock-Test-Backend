"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailProducer = exports.EmailProducer = void 0;
const rabbitmq_connection_1 = require("../connection/rabbitmq-connection");
class EmailProducer {
    constructor() { }
    async send(data) {
        try {
            const channel = await rabbitmq_connection_1.rabbitMQClient.getChannel();
            console.log(data);
            console.log("From the producer");
            const exchange = "main_exchange";
            const routingKey = "email.send";
            await channel.assertExchange(exchange, "direct", { durable: true });
            // 1. Convert the class instance properties into a JSON string
            const jsonString = JSON.stringify(data);
            // 2. Convert the string into raw bytes (Buffer) for RabbitMQ
            const bufferData = Buffer.from(jsonString);
            channel.publish(exchange, routingKey, bufferData, // <-- Send the Buffer, not the object
            { persistent: true });
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
