import { Channel, ConsumeMessage } from "amqplib";
import { emailRepositories } from "../../repositories/email.db";



export class EmailAddingConsumer {
    private connection: any;

    constructor(connection: any) {
        this.connection = connection;
    }

    async start() {
        try {
            const channel = await this.connection.getChannel();
            const exchangeName = "main_exchange";
            const queueName = "emailAdding_queue";
            const routingKey = "emailAdding.send";

            // 1. Assert Exchange
            await channel.assertExchange(exchangeName, "direct", { durable: true });

            // 2. Assert Queue
            await channel.assertQueue(queueName, { durable: true });

            // 3. Bind Queue to Exchange with specific Routing Key
            // This is CRITICAL: It tells RabbitMQ "Only put messages with key 'UpdateTestDetails.update.it' in this queue"
            await channel.bindQueue(queueName, exchangeName, routingKey);

            console.log("Email Adding Consumer waiting for messages...");

            // 4. Consume
            channel.prefetch(1);
            channel.consume(queueName, async (msg: ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const data = JSON.parse(msg.content.toString());
                    
                    console.log(`Processing Student Test Analytics Update for User: ${data.userId}`);

                    // --- ACTUAL WORKER LOGIC ---
                    await emailRepositories.adding(data) ; 
                    // ---------------------------

                    channel.ack(msg);
                    console.log("Email is Added SuccessFully");

                } catch (err) {
                    console.error("Email is adding gets failed:", err);
                    
    
                    channel.nack(msg, false, false);
                }
            });

        } catch (error: any) {
            console.error("Error in  Email Adding Consumer:", error);
            throw error;
        }
    }
}