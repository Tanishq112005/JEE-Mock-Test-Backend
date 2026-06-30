"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
async function explainUpdate() {
    try {
        const res = await database_1.database.$queryRawUnsafe(`
      EXPLAIN ANALYZE 
      UPDATE testStatus 
      SET status = 'PAUSED' 
      WHERE status = 'IN_PROGRESS' 
      AND updated_at < DATE_SUB(NOW(), INTERVAL 90 SECOND);
    `);
        console.log("Explain Analyze Result:");
        console.log(JSON.stringify(res, null, 2));
    }
    catch (err) {
        console.error("Error:", err);
    }
    finally {
        await database_1.database.$disconnect();
    }
}
explainUpdate();
