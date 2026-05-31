"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConsumer = void 0;
const notificationBuilder_1 = require("../../interfaces/notificationBuilder");
const notifications_db_1 = require("../../repositories/notifications.db");
const client_1 = require("@prisma/client");
class EmailConsumer {
    rabbitMQ;
    emailService;
    constructor(rabbitMQ, emailService) {
        this.rabbitMQ = rabbitMQ;
        this.emailService = emailService;
    }
    async start() {
        try {
            const channel = await this.rabbitMQ.getChannel();
            const exchangeName = "main_exchange";
            await channel.assertExchange(exchangeName, "direct", { durable: true });
            const queueName = "email_queue";
            await channel.assertQueue(queueName, { durable: true });
            await channel.assertQueue("email_queue_dead", { durable: true });
            const routingKey = "email.send";
            await channel.bindQueue(queueName, exchangeName, routingKey);
            console.log("Email Consumer started... Waiting for messages...");
            channel.consume(queueName, async (msg) => {
                if (!msg)
                    return;
                try {
                    const data = JSON.parse(msg.content.toString());
                    const rawMessage = data.message ? data.message : data;
                    if (!rawMessage.toEmail && !rawMessage.toPhone) {
                        console.warn("⚠️ Invalid message format:", data);
                        channel.ack(msg);
                        return;
                    }
                    // Build the message
                    const message = new notificationBuilder_1.NotificationBuilder().fromJSON(data).build();
                    // 1. Send the email first
                    await this.emailService.send(message);
                    // ==========================================
                    // TYPE GUARDS & DESERIALIZATION
                    // ==========================================
                    // Helper to check if a string is valid
                    const isValidString = (val) => typeof val === "string" && val.trim().length > 0;
                    // Extract the string values RabbitMQ gave us
                    const incomingTo = message.to;
                    const incomingFrom = message.from;
                    const incomingType = message.type;
                    // Verify if those strings actually match your Prisma Enums
                    const isToValid = Object.values(client_1.SendingPerson).includes(incomingTo);
                    const isFromValid = Object.values(client_1.SendingPerson).includes(incomingFrom);
                    const isTypeValid = Object.values(client_1.NotificationTypes).includes(incomingType);
                    // 2. Validate and Save to Database
                    if (isValidString(message.studentId) &&
                        isValidString(message.content) &&
                        isValidString(message.subject) &&
                        isToValid &&
                        isFromValid &&
                        isTypeValid) {
                        console.log("Worker Validation passed. Offloading DB write...");
                        // Safely cast the strings back to Enums for Prisma
                        await notifications_db_1.notificationRepositories.addingNotifications(message.studentId, incomingTo, incomingFrom, message.content, message.subject, new Date(), ["Email"], incomingType);
                        console.log("Worker successfully saved to database.");
                    }
                    else {
                        console.error(" Worker DB Storage skipped. Data mismatch:", {
                            to: incomingTo, from: incomingFrom, type: incomingType
                        });
                    }
                    // 3. Acknowledge message only after email sends and DB logic completes
                    channel.ack(msg);
                    console.log("Email processed and acknowledged.");
                }
                catch (err) {
                    console.error("Processing failed:", err);
                    channel.nack(msg, false, false);
                }
            });
        }
        catch (err) {
            console.error("Error starting Email Consumer:", err);
            throw err;
        }
    }
}
exports.EmailConsumer = EmailConsumer;
