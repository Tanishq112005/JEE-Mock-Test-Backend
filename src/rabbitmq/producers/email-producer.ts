
import { rabbitMQClient } from "../connection/rabbitmq-connection"; 
import { EmailPayload } from "../../types/emailPayload";

export class EmailProducer {
  constructor() {
  }

  async sendOtp(data: EmailPayload) {
    try {
      const channel = await rabbitMQClient.getChannel(); 
      
      const exchange = "main_exchange";
      const routingKey = "email.send";

      await channel.assertExchange(exchange, "direct", { durable: true });

      channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
      );
      
      console.log(`OTP Sent via RabbitMQ`);

    } catch (err: any) {
      console.error("Producer Error:", err);
      throw err;
    }
  }
}

export const emailProducer = new EmailProducer();