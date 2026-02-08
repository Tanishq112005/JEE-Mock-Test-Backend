"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailAddingProducer = exports.EmailAddingProducer = void 0;
const rabbitmq_connection_1 = require("../connection/rabbitmq-connection");
class EmailAddingProducer {
    constructor() {
    }
    async add(email) {
        try {
            const channel = await rabbitmq_connection_1.rabbitMQClient.getChannel();
            const exchange = "main_exchange";
            const routingKey = "emailAdding.send";
            await channel.assertExchange(exchange, "direct", { durable: true });
            channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(email)), { persistent: true });
            console.log(`Email is Send for adding in the database`);
        }
        catch (err) {
            console.error("Producer Error:", err);
            throw err;
        }
    }
}
exports.EmailAddingProducer = EmailAddingProducer;
exports.emailAddingProducer = new EmailAddingProducer();
