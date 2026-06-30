"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
async function main() {
    try {
        const queries = await database_1.database.$queryRawUnsafe(`
      SELECT 
        DIGEST_TEXT, 
        EXEC_COUNT, 
        SUM_ERRORS, 
        FIRST_SEEN, 
        LAST_SEEN 
      FROM 
        information_schema.STATEMENTS_SUMMARY 
      ORDER BY 
        LAST_SEEN DESC 
      LIMIT 10;
    `);
        console.log("Recent queries:", queries);
    }
    catch (err) {
        console.error("Error:", err);
    }
    finally {
        await database_1.database.$disconnect();
    }
}
main();
