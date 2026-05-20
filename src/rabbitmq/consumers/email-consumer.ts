import { emailSender } from "../../utils/email";

export class EmailConsumer {
  private rabbitMQ: any;

  constructor(rabbitMQ: any) {
    this.rabbitMQ = rabbitMQ;
  }

  async start() {
    try {
      const channel = await this.rabbitMQ.getChannel();
      const exchangeName = "main_exchange";
      await channel.assertExchange(exchangeName, "direct", { durable: true });

      const queueName = "email_queue";
      await channel.assertQueue(queueName, { durable: true });
      await channel.assertQueue("email_queue_dead", { durable: true });

    
      const routingKey = "email.send";
      await channel.bindQueue(queueName, exchangeName, routingKey);

      console.log("Email Consumer started... Waiting for messages...");

      channel.consume(queueName, async (msg: any) => {
        if (!msg) return;

        try {
          let data = JSON.parse(msg.content.toString());
          data.retryCount = data.retryCount || 0;

          console.log(`Email job received via Exchange (retry #${data.retryCount}):`, data);

          await emailSender.send(data);

          channel.ack(msg);
          console.log("Email sent and acknowledged");

        } catch (err) {
       
          console.error("Processing failed", err);
          channel.nack(msg, false, false);
        }
      });

    } catch (err) {
      console.error("Error starting Email Consumer:", err);
      throw err;
    }
  }
}