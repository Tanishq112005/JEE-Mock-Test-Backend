import { rabbitMQClient } from "../connection/rabbitmq-connection";

class SubmitChapterAttemptProducer {
  private channel: any;

  constructor() {}

  async initialize() {
    if (!this.channel) {
      this.channel = await rabbitMQClient.getChannel();
    }
  }

  async submitAttemptData(data: any) {
    try {
      await this.initialize();
      const exchangeName = "main_exchange";
      const routingKey = "SubmitChapterAttempt.submit.it";

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

      console.log("⬆️ Chapter attempt final submit Pushed to the Queue");
    } catch (err: any) {
      console.log("❌ Error pushing chapter attempt submit to Queue: ", err);
      throw err;
    }
  }
}

export const submitChapterAttemptProducer = new SubmitChapterAttemptProducer();
