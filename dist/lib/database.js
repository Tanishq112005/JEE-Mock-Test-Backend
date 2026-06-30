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
        // In Prisma 5.x and later, environment variables are loaded automatically from .env
        // We just instantiate PrismaClient directly. If we need to override the URL dynamically:
        process.env.DATABASE_URL_PRODUCTION = connectionUrl;
        this.instance = new client_1.PrismaClient();
        return this.instance;
    }
}
exports.database = globalForPrisma.prisma || Database.getClient();
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.database;
