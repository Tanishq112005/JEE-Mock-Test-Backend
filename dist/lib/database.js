"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const prisma_adapter_1 = require("@tidbcloud/prisma-adapter");
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const globalForPrisma = globalThis;
function createTiDbAdapter() {
    const connectionUrl = env_1.DATABASE_URL_PRODUCTION || env_1.DATABASE_URL;
    if (!connectionUrl) {
        throw new Error('Missing required environment variable: "DATABASE_URL_PRODUCTION" or "DATABASE_URL"');
    }
    // Connect via HTTPS (Serverless Data API) instead of TCP.
    // This completely eliminates idle connections and persistent pools!
    return new prisma_adapter_1.PrismaTiDBCloud({ url: connectionUrl });
}
class Database {
    static instance = null;
    static getClient() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new client_1.PrismaClient({ adapter: createTiDbAdapter() });
        return this.instance;
    }
}
exports.database = globalForPrisma.prisma || Database.getClient();
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.database;
