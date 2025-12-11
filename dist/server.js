"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const ApiResponse_1 = __importDefault(require("./utils/ApiResponse"));
const auth_1 = require("./routes/auth");
const email_consumer_1 = require("./rabbitmq/consumers/email-consumer");
const rabbitmq_connection_1 = require("./rabbitmq/connection/rabbitmq-connection");
console.log(env_1.PORT);
const port = env_1.PORT || 3000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
// behaving the server as the worker also 
const startServer = async () => {
    try {
        console.log("🔌 Connecting to RabbitMQ...");
        await rabbitmq_connection_1.rabbitMQClient.connect();
        console.log("👷 Starting Email Worker...");
        const emailConsumer = new email_consumer_1.EmailConsumer(rabbitmq_connection_1.rabbitMQClient);
        await emailConsumer.start();
        console.log("✅ Email Worker is running in background.");
        app.listen(env_1.PORT, () => {
            console.log(`🚀 Server is running on port ${env_1.PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
app.use('/api/auth', auth_1.authRoutes);
app.use("/health", function (req, res) {
    res.status(200).json(new ApiResponse_1.default("Server is running good", "ok"));
});
app.listen(port, function () {
    console.log(`Server is running on the port ${port}`);
});
