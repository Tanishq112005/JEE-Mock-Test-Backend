import client, { Connection, Channel } from "amqplib";
import { RABBITMQ_CONNECTION } from "../../config/env";
import ApiError from "../../utils/ApiError";

class RabbitMQClient {
  private connection: any = null;
  private channel: any = null;
  private connected: boolean = false;

  async connect() {
    if (this.connected && this.channel) return;

    try {
      console.log("🔌 Connecting to RabbitMQ...");

      if (!RABBITMQ_CONNECTION) {
         throw new Error("❌ FATAL: RABBITMQ_CONNECTION is undefined. Check .env.dev loading.");
      }

      this.connection = await client.connect(RABBITMQ_CONNECTION);
      this.channel = await this.connection.createChannel();
      
      this.connected = true;
      console.log("RabbitMQ Connected Successfully");
      
    } catch (error: any) {
      console.error("RabbitMQ Connection Failed:", error.message);
      throw new ApiError("Failed to connect to RabbitMQ", error);
    }
  }

  async getChannel(): Promise<Channel> {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel as Channel;
  }
}

export const rabbitMQClient = new RabbitMQClient();