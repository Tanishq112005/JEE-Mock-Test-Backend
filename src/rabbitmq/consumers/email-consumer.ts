import { emailSender } from "../../worker/email";
import { RabbitMQConnection } from "../connection/rabbitmq-connection";

export class EmailConsumer {
  private rabbitMQ: RabbitMQConnection;

  constructor(rabbitMQ: RabbitMQConnection) {
    this.rabbitMQ = rabbitMQ;
  }

  async start() {
    try {
      const channel = await this.rabbitMQ.getChannel();

      
      await channel.assertQueue("email_queue", { durable: true });

      
      await channel.assertQueue("email_queue_dead", { durable: true });

      console.log("📩 Email Consumer started... Waiting for messages...");

      channel.consume("email_queue", async (msg: any) => {
        if (!msg) return;

        try {
          let data = JSON.parse(msg.content.toString());

        
          data.retryCount = data.retryCount || 0;

          console.log(`📨 Email job received (retry #${data.retryCount}):`, data);

          
          await emailSender.send(data);

          
          channel.ack(msg);
          console.log("✅ Email sent and acknowledged");

        } catch (err) {
          let data = JSON.parse(msg.content.toString());
          data.retryCount = data.retryCount || 0;

          console.error("❌ Email processing failed:", err);

          if (data.retryCount < 3) {
            
            data.retryCount++;

            console.log(`🔁 Retrying email... Attempt #${data.retryCount}`);

            channel.sendToQueue(
              "email_queue",
              Buffer.from(JSON.stringify(data)),
              { persistent: true }
            );
          } else {
            console.log("💀 Moving email to dead letter queue");

            
            channel.sendToQueue(
              "email_queue_dead",
              msg.content,
              { persistent: true }
            );
          }

        
          channel.ack(msg);
        }
      });

    } catch (err) {
      console.error("❌ Error starting Email Consumer:", err);
      throw err;
    }
  }
}


