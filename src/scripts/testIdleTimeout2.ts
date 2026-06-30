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
  idleTimeout: 2, connectionLimit: 2
});

async function main() {
  const conn1 = await pool.getConnection();
  const conn2 = await pool.getConnection();
  console.log('Got connections');
  conn1.release();
  conn2.release();
  
  let count = 0;
  const interval = setInterval(async () => {
    // Only request ONE connection, leaving the other idle
    const conn = await pool.getConnection();
    console.log(`Active: ${pool.activeConnections()}, Idle: ${pool.idleConnections()}, Total: ${pool.totalConnections()}`);
    conn.release();
    
    count++;
    if (count > 5) {
      clearInterval(interval);
      pool.end();
    }
  }, 1000);
}

main();
