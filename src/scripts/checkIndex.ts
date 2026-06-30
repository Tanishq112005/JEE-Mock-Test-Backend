import { database as prisma } from "../lib/database";

async function checkIndex() {
  try {
    const res: any = await prisma.$queryRawUnsafe(`SHOW INDEX FROM testStatus;`);
    console.log("Indexes on testStatus table:", res);
  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkIndex();
