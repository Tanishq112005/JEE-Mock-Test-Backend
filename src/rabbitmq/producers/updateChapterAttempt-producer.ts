import { rabbitMQClient } from "../connection/rabbitmq-connection";

class UpdateChapterAttemptProducer {
  private channel: any;

  constructor() {}

  async initialize() {
    if (!this.channel) {
      this.channel = await rabbitMQClient.getChannel();
    }
  }

  async updateAttemptData(data: any) {
    try {
      await this.initialize();
      const exchangeName = "main_exchange";
      const routingKey = "UpdateChapterAttempt.update.it";

      await this.channel.assertExchange(exchangeName, "direct", {
        durable: true,
      });

      this.channel.publish(
        exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true,
        }
      );

      console.log("⬆️ Chapter attempt update Pushed to the Queue");
    } catch (err: any) {
      console.log("❌ Error pushing chapter attempt to Queue: ", err);
      throw err;
    }
  }
}

export const updateChapterAttemptProducer = new UpdateChapterAttemptProducer();
