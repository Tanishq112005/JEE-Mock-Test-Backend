"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
async function main() {
    let count = 0;
    console.log('Starting polling...');
    const interval = setInterval(async () => {
        try {
            const rows = await database_1.database.$queryRawUnsafe('SHOW FULL PROCESSLIST');
            const active = rows.filter(r => r.Command !== 'Sleep' && r.Info !== 'SHOW FULL PROCESSLIST');
            if (active.length > 0) {
                console.log(new Date().toISOString(), active);
            }
        }
        catch (err) {
            console.error(err);
        }
        count++;
        if (count > 60) {
            clearInterval(interval);
            await database_1.database.$disconnect();
        }
    }, 500);
}
main();
