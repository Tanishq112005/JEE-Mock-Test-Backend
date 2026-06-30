import * as mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL found.");
    return;
  }
  
  // Parse DB URL manually (format: mysql://user:password@host:port/database)
  const connection = await mysql.createConnection(dbUrl);

  try {
    const [rows]: any = await connection.execute(
      `SELECT id, correctAnswer, image, comprehensionImage FROM questions WHERE id = '0002695b-5ad6-4174-9e42-a6cb7540d2c2'`
    );
    console.log("Raw row from mysql2:");
    console.log(rows[0]);
    
    console.log("correctAnswer typeof:", typeof rows[0].correctAnswer, "| value:", rows[0].correctAnswer);
    console.log("image typeof:", typeof rows[0].image, "| value:", rows[0].image);
    console.log("comprehensionImage typeof:", typeof rows[0].comprehensionImage, "| value:", rows[0].comprehensionImage);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await connection.end();
  }
}

main();
