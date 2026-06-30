import { connect } from '@tidbcloud/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function killSleepers() {
  const connectionUrl = process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
  if (!connectionUrl) throw new Error('No DB URL');

  const connection = connect({ url: connectionUrl });
  const rows: any = await connection.execute('SHOW FULL PROCESSLIST');
  
  const sleepers = rows.filter((r: any) => r.Command === 'Sleep' && r.Time > 10);
  console.log(`Found ${sleepers.length} sleepers to kill.`);

  for (const sleeper of sleepers) {
    try {
      await connection.execute(`KILL ${sleeper.Id}`);
      console.log(`Killed ${sleeper.Id} (Time: ${sleeper.Time})`);
    } catch (err) {
      console.error(`Failed to kill ${sleeper.Id}:`, err);
    }
  }
}

killSleepers();
