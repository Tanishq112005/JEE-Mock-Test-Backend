"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitMQClient = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const env_1 = require("../../config/env");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
class RabbitMQClient {
    connection = null;
    channel = null;
    connected = false;
    async connect() {
        if (this.connected && this.channel)
            return;
        try {
            console.log("🔌 Connecting to RabbitMQ...");
            if (!env_1.RABBITMQ_CONNECTION) {
                throw new Error("❌ FATAL: RABBITMQ_CONNECTION is undefined. Check .env.dev loading.");
            }
            this.connection = await amqplib_1.default.connect(env_1.RABBITMQ_CONNECTION);
            this.channel = await this.connection.createChannel();
            this.connected = true;
            console.log("RabbitMQ Connected Successfully");
        }
        catch (error) {
            console.error("RabbitMQ Connection Failed:", error.message);
            throw new ApiError_1.default("Failed to connect to RabbitMQ", error);
        }
    }
    async getChannel() {
        if (!this.channel) {
            await this.connect();
        }
        return this.channel;
    }
}
exports.rabbitMQClient = new RabbitMQClient();
