"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
async function checkDDL() {
    try {
        const jobs = await database_1.database.$queryRawUnsafe(`ADMIN SHOW DDL JOBS;`);
        const activeJobs = jobs.filter((job) => job.STATE !== 'synced' && job.STATE !== 'cancelled');
        console.log("Active DDL Jobs:", activeJobs);
    }
    catch (err) {
        console.error("Error:", err);
    }
    finally {
        await database_1.database.$disconnect();
    }
}
checkDDL();
