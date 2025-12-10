
import { rabbitMQClient } from "../connection/rabbitmq-connection"; 
import { email_data } from "../../types/email.worker.types";

export class EmailProducer {
  constructor() {
  }

  async sendOtp(data: email_data) {
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