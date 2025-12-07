import amqp from "amqplib";
import ApiError from "../../utils/ApiError";


export class RabbitMQConnection {
  private connection: any = null;
  private channel: any = null;
  private url: string;

  constructor(url: string = "amqp://localhost") {
    this.url = url;
  }

  private async connect(): Promise<void> {
    if (!this.connection) {
      try {
        this.connection = await amqp.connect(this.url);
        console.log("🐇 Connected to RabbitMQ");
      } catch (err: any) {
        throw new ApiError("Failed to connect to RabbitMQ", err);
      }
    }
  }

  async getChannel(): Promise<any> {
    if (this.channel) return this.channel;

    await this.connect();
    this.channel = await this.connection!.createChannel();
    return this.channel;
  }
}


export const connection = new RabbitMQConnection() ; 