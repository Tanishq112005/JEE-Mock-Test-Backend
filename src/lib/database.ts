import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, DATABASE_URL_PRODUCTION } from "../config/env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

class Database {
  private static instance: PrismaClient | null = null;

  public static getClient(): PrismaClient {
    if (this.instance) {
      return this.instance;
    }

    const connectionUrl = DATABASE_URL_PRODUCTION || DATABASE_URL;

    if (!connectionUrl) {
      throw new Error('Missing required environment variable: "DATABASE_URL_PRODUCTION" or "DATABASE_URL"');
    }

    // In Prisma 5.x and later, environment variables are loaded automatically from .env
    // We just instantiate PrismaClient directly. If we need to override the URL dynamically:
    process.env.DATABASE_URL_PRODUCTION = connectionUrl;

    this.instance = new PrismaClient();
    
    return this.instance;
  }
}

export const database = globalForPrisma.prisma || Database.getClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = database;
