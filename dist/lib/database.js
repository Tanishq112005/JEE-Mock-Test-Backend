"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const globalForPrisma = globalThis;
class Database {
    static instance = null;
    static getClient() {
        if (this.instance) {
            return this.instance;
        }
        const pool = new pg_1.Pool({ connectionString: env_1.DATABASE_URL });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        this.instance = new client_1.PrismaClient({ adapter });
        return this.instance;
    }
}
exports.database = globalForPrisma.prisma || Database.getClient();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.database;
