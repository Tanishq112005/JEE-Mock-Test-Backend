"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
async function checkProcessList() {
    try {
        const processList = await database_1.database.$queryRawUnsafe(`SHOW FULL PROCESSLIST;`);
        console.log("Current Active Connections:");
        processList.forEach((p) => {
            console.log(`- ID: ${p.Id}, User: ${p.User}, Host: ${p.Host}, DB: ${p.db}, Command: ${p.Command}, Time: ${p.Time}, State: ${p.State}, Info: ${p.Info}`);
        });
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await database_1.database.$disconnect();
    }
}
checkProcessList();
