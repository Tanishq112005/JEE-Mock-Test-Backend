"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const globalForPrisma = globalThis;
class Database {
    static instance = null;
    static getClient() {
        if (this.instance) {
            return this.instance;
        }
        const connectionUrl = env_1.DATABASE_URL_PRODUCTION || env_1.DATABASE_URL;
        if (!connectionUrl) {
            throw new Error('Missing required environment variable: "DATABASE_URL_PRODUCTION" or "DATABASE_URL"');
        }
        // Use Prisma's native, highly-optimized connection pool instead of the MariaDB adapter
        // This stops the connection pool from constantly dropping and recreating TCP connections,
        // which was consuming ~38 RUs per second in TiDB Serverless due to connection initialization queries.
        this.instance = new client_1.PrismaClient({
            datasourceUrl: connectionUrl
        });
        return this.instance;
    }
}
exports.database = globalForPrisma.prisma || Database.getClient();
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.database;
