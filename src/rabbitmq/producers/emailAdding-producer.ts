import { rabbitMQClient } from "../connection/rabbitmq-connection"; 


export class EmailAddingProducer {
  constructor() {
  }

  async add(email : string) {
    try {
      const channel = await rabbitMQClient.getChannel(); 

      const exchange = "main_exchange";
      const routingKey = "emailAdding.send";

      await channel.assertExchange(exchange, "direct", { durable: true });

      channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(email)),
        { persistent: true }
      );
      
      console.log(`Email is Send for adding in the database`);

    } catch (err: any) {
      console.error("Producer Error:", err);
      throw err;
    }
  }
}

export const emailAddingProducer = new EmailAddingProducer();