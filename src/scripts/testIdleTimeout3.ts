import mariadb from 'mariadb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL_PRODUCTION;
if (!dbUrl) throw new Error('No DB URL');

const host = dbUrl.split('@')[1].split(':')[0];
const user = dbUrl.split('//')[1].split(':')[0];
const password = dbUrl.split(':')[2].split('@')[0];

const pool = mariadb.createPool({
  host, port: 4000, user, password, database: 'production', ssl: true,
  idleTimeout: 1, connectionLimit: 2, minDelayValidation: 500
});

async function main() {
  const conn = await pool.getConnection();
  console.log('Got connection');
  conn.release();
  
  let count = 0;
  const interval = setInterval(() => {
    console.log(`Active: ${pool.activeConnections()}, Idle: ${pool.idleConnections()}, Total: ${pool.totalConnections()}`);
    count++;
    if (count > 5) {
      clearInterval(interval);
      pool.end();
    }
  }, 1000);
}

main();
