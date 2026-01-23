"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatingTestDetailsProducer = void 0;
const rabbitmq_connection_1 = require("../connection/rabbitmq-connection");
class UpdatingTestDetailsProducer {
    constructor() { }
    async updateData(data) {
        try {
            const channel = await rabbitmq_connection_1.rabbitMQClient.getChannel();
            const exchange = "main_exchange";
            const routingKey = "UpdateTestDetails.update.it";
            // Always assert the exchange exists before publishing
            await channel.assertExchange(exchange, "direct", { durable: true });
            channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), { persistent: true } // Ensures message survives server restart
            );
            console.log(`📤 Update Test Details sent to RabbitMQ`);
        }
        catch (err) {
            console.error("❌ Update Test Details Producer Error:", err);
            throw err;
        }
    }
}
exports.updatingTestDetailsProducer = new UpdatingTestDetailsProducer();
