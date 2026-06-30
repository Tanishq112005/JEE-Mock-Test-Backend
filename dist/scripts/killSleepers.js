"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serverless_1 = require("@tidbcloud/serverless");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env' });
async function killSleepers() {
    const connectionUrl = process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
    if (!connectionUrl)
        throw new Error('No DB URL');
    const connection = (0, serverless_1.connect)({ url: connectionUrl });
    const rows = await connection.execute('SHOW FULL PROCESSLIST');
    const sleepers = rows.filter((r) => r.Command === 'Sleep' && r.Time > 10);
    console.log(`Found ${sleepers.length} sleepers to kill.`);
    for (const sleeper of sleepers) {
        try {
            await connection.execute(`KILL ${sleeper.Id}`);
            console.log(`Killed ${sleeper.Id} (Time: ${sleeper.Time})`);
        }
        catch (err) {
            console.error(`Failed to kill ${sleeper.Id}:`, err);
        }
    }
}
killSleepers();
