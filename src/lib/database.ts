import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, DATABASE_URL_PRODUCTION } from "../config/env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createMariaDbAdapter() {
  const connectionUrl = DATABASE_URL_PRODUCTION || DATABASE_URL;

  if (!connectionUrl) {
    throw new Error('Missing required environment variable: "DATABASE_URL_PRODUCTION" or "DATABASE_URL"');
  }

  const databaseUrl = new URL(connectionUrl);
  const database = databaseUrl.pathname.replace(/^\//, "");

  return new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database,
    connectTimeout: 20000,
    // Limit maximum concurrent connections (default 5, adjustable via connection_limit in URL)
    connectionLimit: Number(databaseUrl.searchParams.get("connection_limit") ?? 5), 
    idleTimeout: 30000, // Gracefully close idle connections before TiDB forcibly drops them
    ssl: databaseUrl.searchParams.has("sslaccept") ? true : undefined,
  });
}

class Database {
  private static instance: PrismaClient | null = null;

  public static getClient(): PrismaClient {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new PrismaClient({ adapter: createMariaDbAdapter() });
    
    return this.instance;
  }
}

export const database = globalForPrisma.prisma || Database.getClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = database;
