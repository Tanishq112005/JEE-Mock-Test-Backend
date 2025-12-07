import { PrismaClient } from "../prisma/generated/prisma/client";
import { readReplicas } from '@prisma/extension-read-replicas';
import { DATABASE_URL, DATABASE_REPICA_URL } from "../config/env"; 

const createExtendedClient = () => {

  return new PrismaClient().$extends( 
    readReplicas({
      url: DATABASE_URL as string,
      replicas: [ DATABASE_REPICA_URL as string ],
    } as any)
  ) ;
};

type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

class Database {
  private db: ExtendedPrismaClient | null; 

  constructor() {
    this.db = null;
  }

  public getClient(): ExtendedPrismaClient {
    if (this.db) return this.db;

    this.db = createExtendedClient();
    return this.db;
  }
}

export const database = new Database().getClient();