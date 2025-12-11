import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "../config/env";


const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

class Database {
  private static instance: PrismaClient | null = null;

  public static getClient(): PrismaClient {
   
    if (this.instance) {
      return this.instance;
    }

    const pool = new Pool({ connectionString: DATABASE_URL })
    const adapter = new PrismaPg(pool)
    this.instance = new PrismaClient({ adapter })
    return this.instance;
  }
}


export const database = globalForPrisma.prisma || Database.getClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = database