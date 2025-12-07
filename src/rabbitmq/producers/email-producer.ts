import { RABBITMQ_CONNECTION } from "../../config/env";
import { email_data } from "../../types/email.worker.types";
import ApiError from "../../utils/ApiError";



export class EmailProducer {
  private exchange = "main_exchange";
  private rabbitMQConnection: any;

  constructor(rabbitMQConnection: any) {
    this.rabbitMQConnection = rabbitMQConnection;
  }

  async sendOtp(data:email_data) {
    try {
      const channel = await this.rabbitMQConnection.getChannel();

      
      await channel.assertExchange(this.exchange, "direct", { durable: true });

      
      channel.publish(
        this.exchange,
        "email.send",
        Buffer.from(JSON.stringify(data))
      );

      console.log(`📩 OTP event sent for ${data.email_to}`);
    } catch (err: any) {
      throw new ApiError("Error sending OTP message", err);
    }
  }
}



export const emailProducer = new EmailProducer(RABBITMQ_CONNECTION);




