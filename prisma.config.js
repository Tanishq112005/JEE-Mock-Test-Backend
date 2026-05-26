import { defineConfig, env } from "prisma/config";
import dotenv from 'dotenv';
import path from 'path';


dotenv.config({ path: path.resolve(__dirname, './.env') });

export default defineConfig({
  
  schema: "./prisma/schema.prisma",
  
  migrations: {
    path: "./prisma/migrations",
  },
  
  datasource: {
    url: process.env.DATABASE_URL_PRODUCTION ?? env('DATABASE_URL')
  },
});
