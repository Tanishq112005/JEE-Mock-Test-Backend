"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentTestAnalytics = void 0;
const rabbitmq_connection_1 = require("../connection/rabbitmq-connection");
class StudentTestAnanlytics {
    constructor() { }
    async updateData(data) {
        try {
            const channel = await rabbitmq_connection_1.rabbitMQClient.getChannel();
            const exchange = "main_exchange";
            const routingKey = "studentAnalytics.update.it";
            // Always assert the exchange exists before publishing
            await channel.assertExchange(exchange, "direct", { durable: true });
            channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), { persistent: true } // Ensures message survives server restart
            );
            console.log(`📤 Update Student Test Analytics sent to RabbitMQ`);
        }
        catch (err) {
            console.error("❌ Update Student Test Analytics Producer Error:", err);
            throw err;
        }
    }
}
exports.studentTestAnalytics = new StudentTestAnanlytics();
