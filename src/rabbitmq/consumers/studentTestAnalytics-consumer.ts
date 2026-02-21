import { Channel, ConsumeMessage } from "amqplib";
import { analytics } from "../../repositories/analytics.db";
import { reddisConfigForCaching } from "../../lib/caching";



export class StudentTestAnanlyticsConsumer {
    private connection: any;

    constructor(connection: any) {
        this.connection = connection;
    }

    async start() {
        try {
            const channel = await this.connection.getChannel();
            const exchangeName = "main_exchange";
            const queueName = "studentTestAnalytics_queue";
            const routingKey = "studentAnalytics.update.it";

            // 1. Assert Exchange
            await channel.assertExchange(exchangeName, "direct", { durable: true });

            // 2. Assert Queue
            await channel.assertQueue(queueName, { durable: true });

            // 3. Bind Queue to Exchange with specific Routing Key
            // This is CRITICAL: It tells RabbitMQ "Only put messages with key 'UpdateTestDetails.update.it' in this queue"
            await channel.bindQueue(queueName, exchangeName, routingKey);

            console.log("🔄 Stduent Test Analytics Consumer waiting for messages...");

            // 4. Consume
            channel.prefetch(1);
            channel.consume(queueName, async (msg: ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const data = JSON.parse(msg.content.toString());
                    
                    console.log(`📥 Processing Student Test Analytics Update for User: ${data.studentId}`);

                       await analytics.persistTestAnalytics(data.testId , data.studentId , data.report) ; 
                       await reddisConfigForCaching.deletingData(`${data.studentId}:${data.testId}:${data.created_at}`) ; 

                    channel.ack(msg);
                    console.log("✅ Update The Student Test Analytics  Evaluated SuccessFully");

                } catch (err) {
                    console.error("❌ Processing failed for  Student Test Analytics :", err);
                    
    
                    channel.nack(msg, false, false);
                }
            });

        } catch (error: any) {
            console.error("❌ Error in   Student Test Analytics  Consumer:", error);
            throw error;
        }
    }
}