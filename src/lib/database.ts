import { PrismaTiDBCloud } from '@tidbcloud/prisma-adapter';
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, DATABASE_URL_PRODUCTION } from "../config/env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createTiDbAdapter() {
  const connectionUrl = DATABASE_URL_PRODUCTION || DATABASE_URL;

  if (!connectionUrl) {
    throw new Error('Missing required environment variable: "DATABASE_URL_PRODUCTION" or "DATABASE_URL"');
  }

  // This fetch interceptor prevents Prisma Engine from crashing on JSON columns.
  // The TiDB Serverless API returns JSON columns with type="JSON", which causes
  // the JS driver to parse them into objects. The Prisma Engine expects a string.
  // By replacing "JSON" with "VARCHAR" in the response, we force the driver to 
  // return a string, which Prisma Engine can safely accept and then parse itself!
  const customFetch = async (url: string, options: any) => {
    const res = await fetch(url, options);
    let text = await res.text();
    text = text.replace(/"type":"JSON"/g, '"type":"VARCHAR"');
    return new Response(text, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  };

  return new PrismaTiDBCloud({ url: connectionUrl, fetch: customFetch } as any);
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
