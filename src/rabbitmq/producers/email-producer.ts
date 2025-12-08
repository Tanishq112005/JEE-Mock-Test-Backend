import { email_data } from "../../types/email.worker.types";
import ApiError from "../../utils/ApiError";
import { rabbitMQClient } from "../connection/rabbitmq-connection"; 

export class EmailProducer {
  private exchange = "main_exchange"; 
  private routingKey = "email.send";  
  private rabbitMQConnection: any;

  constructor(rabbitMQConnection: any) {
    this.rabbitMQConnection = rabbitMQConnection;
  }

  async sendOtp(data: email_data) {
    try {
      const channel = await this.rabbitMQConnection.getChannel();

     
      await channel.assertExchange(this.exchange, "direct", { durable: true });

     
      const sent = channel.publish(
        this.exchange,
        this.routingKey,
        Buffer.from(JSON.stringify(data)),
        { persistent: true } 
      );

      if (sent) {
        console.log(`OTP sent to Exchange '${this.exchange}' with key '${this.routingKey}'`);
      } else {
        console.error("Message was rejected by the Exchange (Buffer full?)");
      }

    } catch (err: any) {
      console.error("Producer Error:", err);
      throw new ApiError("Error sending OTP message", err);
    }
  }
}

export const emailProducer = new EmailProducer(rabbitMQClient);