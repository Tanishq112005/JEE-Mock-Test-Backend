import { rabbitMQClient } from "../connection/rabbitmq-connection"; 
import { NotificationMessage } from "../../interfaces/notificationInterface";

export class EmailProducer {
  constructor() {}

  async send(data: NotificationMessage) {
    try {
      const channel = await rabbitMQClient.getChannel(); 
      console.log(data); 
      console.log("From the producer");
      
      const exchange = "main_exchange";
      const routingKey = "email.send";

      await channel.assertExchange(exchange, "direct", { durable: true });

      // 1. Convert the class instance properties into a JSON string
      const jsonString = JSON.stringify(data);
      
      // 2. Convert the string into raw bytes (Buffer) for RabbitMQ
      const bufferData = Buffer.from(jsonString);

      channel.publish(
        exchange,
        routingKey,
        bufferData, // <-- Send the Buffer, not the object
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