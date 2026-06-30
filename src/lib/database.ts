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

    // Use Prisma's native, highly-optimized connection pool instead of the MariaDB adapter
    // This stops the connection pool from constantly dropping and recreating TCP connections,
    // which was consuming ~38 RUs per second in TiDB Serverless due to connection initialization queries.
    this.instance = new PrismaClient({
      datasourceUrl: connectionUrl
    });
    
    return this.instance;
  }
}

export const database = globalForPrisma.prisma || Database.getClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = database;
