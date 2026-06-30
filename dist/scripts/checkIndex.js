"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
async function checkIndex() {
    try {
        const res = await database_1.database.$queryRawUnsafe(`SHOW INDEX FROM testStatus;`);
        console.log("Indexes on testStatus table:", res);
    }
    catch (err) {
        console.error("Error:", err);
    }
    finally {
        await database_1.database.$disconnect();
    }
}
checkIndex();
