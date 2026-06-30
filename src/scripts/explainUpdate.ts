import { database as prisma } from "../lib/database";

async function explainUpdate() {
  try {
    const res: any = await prisma.$queryRawUnsafe(`
      EXPLAIN ANALYZE 
      UPDATE testStatus 
      SET status = 'PAUSED' 
      WHERE status = 'IN_PROGRESS' 
      AND updated_at < DATE_SUB(NOW(), INTERVAL 90 SECOND);
    `);
    console.log("Explain Analyze Result:");
    console.log(JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

explainUpdate();
