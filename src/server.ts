import express from "express" ; 
import { PORT } from "./config/env";
import { Request , Response } from "express";
import ApiResponse from "./utils/ApiResponse";
import { authRoutes } from "./routes/auth";
console.log(PORT) ;
const port  = PORT || 3000; 
const app = express() ; 
app.use(express.json()) ;

app.use('/api/auth' , authRoutes);


app.use("/health" , function(req : Request , res : Response){
    res.status(200).json(
        new ApiResponse("Server is running good" ,"ok") 
    );
})


app.listen(port , function(){
    console.log(`Server is running on the port ${port}`) ;
})


