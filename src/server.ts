import express from "express" ; 
import { PORT } from "./config/env";
import { Request , Response } from "express";
import ApiResponse from "./utils/ApiResponse";
import { authRoutes } from "./routes/auth";
import { EmailConsumer } from "./rabbitmq/consumers/email-consumer";
import { rabbitMQClient } from "./rabbitmq/connection/rabbitmq-connection";
console.log(PORT) ;
const port  = PORT || 3000; 
const app = express() ; 
app.use(express.json()) ;



// behaving the server as the worker also 

const startServer = async () => {
    try {
        console.log("🔌 Connecting to RabbitMQ...");
        await rabbitMQClient.connect(); 
        
        console.log("👷 Starting Email Worker...");
        const emailConsumer = new EmailConsumer(rabbitMQClient);
        await emailConsumer.start();
        console.log("✅ Email Worker is running in background.");

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();



app.use('/api/auth' , authRoutes);


app.use("/health" , function(req : Request , res : Response){
    res.status(200).json(
        new ApiResponse("Server is running good" ,"ok") 
    );
})


app.listen(port , function(){
    console.log(`Server is running on the port ${port}`) ;
})


