import { database as prisma } from "../lib/database";

async function main() {
  try {
    const queries: any = await prisma.$queryRawUnsafe(`
      SELECT 
        DIGEST_TEXT, 
        EXEC_COUNT, 
        SUM_ERRORS, 
        FIRST_SEEN, 
        LAST_SEEN 
      FROM 
        information_schema.STATEMENTS_SUMMARY 
      ORDER BY 
        LAST_SEEN DESC 
      LIMIT 10;
    `);
    console.log("Recent queries:", queries);
  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
