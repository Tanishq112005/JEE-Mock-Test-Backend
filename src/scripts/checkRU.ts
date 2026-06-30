import { database as prisma } from "../lib/database";

async function checkRU() {
  try {
    const res: any = await prisma.$queryRawUnsafe(`SELECT * FROM information_schema.resource_groups;`);
    console.log("Resource groups:", res);
  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkRU();
