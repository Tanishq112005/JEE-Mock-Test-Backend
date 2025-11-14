import dotenv from "dotenv" ;
dotenv.config() ; 

export const {
    PORT,
    JWT_SECRET , 
    JWT_TEMP_EXPIRES_IN,
    JWT_ALGORITHM
} = process.env ; 

