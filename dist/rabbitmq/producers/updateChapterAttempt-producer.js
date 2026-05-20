"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChapterAttemptProducer = void 0;
const rabbitmq_connection_1 = require("../connection/rabbitmq-connection");
class UpdateChapterAttemptProducer {
    channel;
    constructor() { }
    async initialize() {
        if (!this.channel) {
            this.channel = await rabbitmq_connection_1.rabbitMQClient.getChannel();
        }
    }
    async updateAttemptData(data) {
        try {
            await this.initialize();
            const exchangeName = "main_exchange";
            const routingKey = "UpdateChapterAttempt.update.it";
            await this.channel.assertExchange(exchangeName, "direct", {
                durable: true,
            });
            this.channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data)), {
                persistent: true,
            });
            console.log("Chapter attempt update Pushed to the Queue");
        }
        catch (err) {
            console.log("Error pushing chapter attempt to Queue: ", err);
            throw err;
        }
    }
}
exports.updateChapterAttemptProducer = new UpdateChapterAttemptProducer();
