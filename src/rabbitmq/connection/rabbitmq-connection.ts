import client, { Connection, Channel } from "amqplib";
import { RABBITMQ_CONNECTION } from "../../config/env";
import ApiError from "../../utils/ApiError";

class RabbitMQClient {
  private connection: any = null;
  private channel: any = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnecting: boolean = false; // 🔒 Lock flag
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_DELAY_MS = 5000;

  async connect() {
    if (this.connected && this.channel) return;

    try {
      console.log(`Connecting to RabbitMQ... (Attempt ${this.reconnectAttempts + 1})`);

      if (!RABBITMQ_CONNECTION) {
        throw new Error("FATAL: RABBITMQ_CONNECTION is undefined. Check .env.dev loading.");
      }

      this.connection = await client.connect(RABBITMQ_CONNECTION);
      this.channel = await this.connection.createChannel();
      this.connected = true;
      this.reconnecting = false;
      this.reconnectAttempts = 0;
      console.log("RabbitMQ Connected Successfully");

      this.connection.on("error", (err: Error) => {
        console.error("RabbitMQ Connection Error:", err.message);
        this.handleDisconnect();
      });

      this.connection.on("close", () => {
        console.warn("RabbitMQ Connection Closed. Triggering reconnect...");
        this.handleDisconnect();
      });

      this.channel.on("error", (err: Error) => {
        console.error("RabbitMQ Channel Error:", err.message);
        this.handleDisconnect();
      });

      this.channel.on("close", () => {
        console.warn("RabbitMQ Channel Closed. Triggering reconnect...");
        this.handleDisconnect();
      });

    } catch (error: any) {
      console.error("RabbitMQ Connection Failed:", error.message);
      this.connected = false;
      this.channel = null;
      this.connection = null;
      await this.scheduleReconnect();
    }
  }

  private handleDisconnect() {
    // Prevent multiple simultaneous reconnect loops
    if (this.reconnecting) return;

    this.connected = false;
    this.channel = null;
    this.connection = null;
    this.reconnecting = true;
    this.scheduleReconnect();
  }

  private async scheduleReconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error(`Max reconnect attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      this.reconnecting = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = this.RECONNECT_DELAY_MS * this.reconnectAttempts;
    console.log(`Reconnecting in ${delay / 1000}s... (Attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);

    await new Promise((resolve) => setTimeout(resolve, delay));
    await this.connect();
  }

  async getChannel(): Promise<Channel> {
    // If reconnection is in progress, wait until it resolves
    if (this.reconnecting) {
      console.log("Waiting for RabbitMQ reconnection...");
      await this.waitForReconnection();
    }

    if (!this.channel || !this.connected) {
      await this.connect();
    }

    return this.channel as Channel;
  }

  // Polls until reconnection is done or channel is available
  private waitForReconnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.connected && this.channel) {
          clearInterval(interval);
          resolve();
        } else if (!this.reconnecting && (!this.connected || !this.channel)) {
          // Reconnection gave up
          clearInterval(interval);
          reject(new ApiError("RabbitMQ is unavailable after reconnection attempts", new Error("Reconnection failed")));
        }
      }, 500);
    });
  }
}

export const rabbitMQClient = new RabbitMQClient();