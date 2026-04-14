"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitChapterAttemptProducer = void 0;
const rabbitmq_connection_1 = require("../connection/rabbitmq-connection");
class SubmitChapterAttemptProducer {
    channel;
    constructor() { }
    async initialize() {
        if (!this.channel) {
            this.channel = await rabbitmq_connection_1.rabbitMQClient.getChannel();
        }
    }
    async submitAttemptData(data) {
        try {
            await this.initialize();
            const exchangeName = "main_exchange";
            const routingKey = "SubmitChapterAttempt.submit.it";
            await this.channel.assertExchange(exchangeName, "direct", {
                durable: true,
            });
            this.channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data)), {
                persistent: true,
            });
            console.log("⬆️ Chapter attempt final submit Pushed to the Queue");
        }
        catch (err) {
            console.log("❌ Error pushing chapter attempt submit to Queue: ", err);
            throw err;
        }
    }
}
exports.submitChapterAttemptProducer = new SubmitChapterAttemptProducer();
