"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
async function checkRU() {
    try {
        const res = await database_1.database.$queryRawUnsafe(`SELECT * FROM information_schema.resource_groups;`);
        console.log("Resource groups:", res);
    }
    catch (err) {
        console.error("Error:", err);
    }
    finally {
        await database_1.database.$disconnect();
    }
}
checkRU();
