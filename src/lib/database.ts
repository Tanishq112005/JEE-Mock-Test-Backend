import { PrismaTiDBCloud } from '@tidbcloud/prisma-adapter';
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, DATABASE_URL_PRODUCTION } from "../config/env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createTiDbAdapter() {
  const connectionUrl = DATABASE_URL_PRODUCTION || DATABASE_URL;

  if (!connectionUrl) {
    throw new Error('Missing required environment variable: "DATABASE_URL_PRODUCTION" or "DATABASE_URL"');
  }

  // Connect via HTTPS (Serverless Data API) instead of TCP.
  // This completely eliminates idle connections and persistent pools!
  return new PrismaTiDBCloud({ url: connectionUrl });
}

class Database {
  private static instance: PrismaClient | null = null;

  public static getClient(): PrismaClient {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new PrismaClient({ adapter: createTiDbAdapter() });
    
    return this.instance;
  }
}

export const database = globalForPrisma.prisma || Database.getClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = database;
