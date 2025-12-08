
import * as client from "amqplib"; 
import { Connection, Channel } from "amqplib";
import { RABBITMQ_CONNECTION } from "../../config/env";
import ApiError from "../../utils/ApiError";
class RabbitMQClient {
  private connection: any = null;
  private channel: any = null;
  private connected: boolean = false;

  async connect() {
    if (this.connected && this.channel) return;

    try {
      console.log("Connecting to RabbitMQ...");
     
      const connection_string : any = RABBITMQ_CONNECTION ; 
      this.connection = await client.connect(connection_string);
      
    
      this.channel = await this.connection.createChannel();
      
      this.connected = true;
      console.log("RabbitMQ Connected Successfully");
      
    } catch (error : any) {
      console.error("RabbitMQ Connection Failed:", error);
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