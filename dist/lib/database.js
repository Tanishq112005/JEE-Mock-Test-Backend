"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const globalForPrisma = globalThis;
function createMariaDbAdapter() {
    const connectionUrl = env_1.DATABASE_URL_PRODUCTION || env_1.DATABASE_URL;
    if (!connectionUrl) {
        throw new Error('Missing required environment variable: "DATABASE_URL_PRODUCTION" or "DATABASE_URL"');
    }
    const databaseUrl = new URL(connectionUrl);
    const database = databaseUrl.pathname.replace(/^\//, "");
    return new adapter_mariadb_1.PrismaMariaDb({
        host: databaseUrl.hostname,
        port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
        user: decodeURIComponent(databaseUrl.username),
        password: decodeURIComponent(databaseUrl.password),
        database,
        connectTimeout: 20000,
        // Limit maximum concurrent connections
        connectionLimit: Number(databaseUrl.searchParams.get("connection_limit") ?? 5),
        idleTimeout: 30, // seconds
        ssl: databaseUrl.searchParams.has("sslaccept") ? true : undefined,
    });
}
class Database {
    static instance = null;
    static getClient() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new client_1.PrismaClient({ adapter: createMariaDbAdapter() });
        return this.instance;
    }
}
exports.database = globalForPrisma.prisma || Database.getClient();
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.database;
