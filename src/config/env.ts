import dotenv from "dotenv" ;
dotenv.config() ; 

export const {
    PORT,
    JWT_SECRET , 
    JWT_TEMP_EXPIRES_IN,
    JWT_ALGORITHM,
    DATABASE_URL ,
    DATABASE_REPICA_URL,
    REDIS_HOST,
    REDIS_PORT,
    EMAIL_ID,
    GOOGLE_AUTH_PASSWORD,
    RABBITMQ_CONNECTION,
    OTP_EXPIRE_TIME
} = process.env ; 

