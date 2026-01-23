import { rabbitMQClient } from "../connection/rabbitmq-connection";

class UpdatingTestDetailsProducer {
    constructor() {}

    async updateData(data: any) {
        try {
            const channel = await rabbitMQClient.getChannel();
            const exchange = "main_exchange";
            const routingKey = "UpdateTestDetails.update.it";

            // Always assert the exchange exists before publishing
            await channel.assertExchange(exchange, "direct", { durable: true });

            channel.publish(
                exchange,
                routingKey,
                Buffer.from(JSON.stringify(data)),
                { persistent: true } // Ensures message survives server restart
            );

            console.log(`📤 Update Test Details sent to RabbitMQ`);
        } catch (err: any) {
            console.error("❌ Update Test Details Producer Error:", err);
            throw err;
        }
    }
}

export const updatingTestDetailsProducer = new UpdatingTestDetailsProducer();