import { database as prisma } from "../lib/database";

async function checkQueries() {
  try {
    const res: any = await prisma.$queryRawUnsafe(`
      SELECT digest_text, exec_count, sum_latency, avg_latency 
      FROM information_schema.statements_summary 
      ORDER BY exec_count DESC 
      LIMIT 20;
    `);
    console.log("Top Queries by Exec Count:", res);
  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkQueries();
