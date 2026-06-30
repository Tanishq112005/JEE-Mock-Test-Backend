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
    // This fetch interceptor prevents Prisma Engine from crashing on JSON columns.
    // The TiDB Serverless API returns JSON columns with type="JSON", which causes
    // the JS driver to parse them into objects. The Prisma Engine expects a string.
    // By replacing "JSON" with "VARCHAR" in the response, we force the driver to 
    // return a string, which Prisma Engine can safely accept and then parse itself!
    const customFetch = async (url, options) => {
        const res = await fetch(url, options);
        let text = await res.text();
        text = text.replace(/"type":"JSON"/g, '"type":"VARCHAR"');
        return new Response(text, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
        });
    };
    return new prisma_adapter_1.PrismaTiDBCloud({ url: connectionUrl, fetch: customFetch });
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
