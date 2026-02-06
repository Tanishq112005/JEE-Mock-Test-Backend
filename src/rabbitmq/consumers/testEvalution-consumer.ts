import { Channel, ConsumeMessage } from "amqplib";
import { testStatus } from "../../repositories/testStatus.db"; // Make sure this path points to your TestStatus class instance
import { studentTestAnalytics } from "../producers/studentTestAnalytics-producer";


export class UpdateFinalEvaluationConsumer {
    private connection: any;

    constructor(connection: any) {
        this.connection = connection;
    }

    async start() {
        try {
            const channel = await this.connection.getChannel();
            const exchangeName = "main_exchange";
            const queueName = "testEvalution_queue";
            const routingKey = "TestEvaluation.it";

            // 1. Assert Exchange
            await channel.assertExchange(exchangeName, "direct", { durable: true });

            // 2. Assert Queue
            await channel.assertQueue(queueName, { durable: true });

            // 3. Bind Queue to Exchange with specific Routing Key
            // This is CRITICAL: It tells RabbitMQ "Only put messages with key 'UpdateTestDetails.update.it' in this queue"
            await channel.bindQueue(queueName, exchangeName, routingKey);
        
            console.log("🔄 Test Evalution Consumer waiting for messages...");

            // 4. Consume
            channel.prefetch(1);
            channel.consume(queueName, async (msg: ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const data = JSON.parse(msg.content.toString());
                    
                    console.log(`📥 Processing Test Update for User: ${data.userId}`);

                    // --- ACTUAL WORKER LOGIC ---
                    await testStatus.updatingTestDetails(data);
                    await testStatus.submitTest(data.testId) ; 
                    await studentTestAnalytics.updateData(data.testId) ; 
                    // ---------------------------

                    channel.ack(msg);
                    console.log("✅ Test Is  Evaluated SuccessFully");

                } catch (err) {
                    console.error("❌ Processing failed for Test Evalutaion:", err);
                    
    
                    channel.nack(msg, false, false);
                }
            });

        } catch (error: any) {
            console.error("❌ Error in  TestUpdate Consumer:", error);
            throw error;
        }
    }
}