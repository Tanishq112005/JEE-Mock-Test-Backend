import { database as prisma } from "../lib/database";

async function checkProcessList() {
  try {
    const processList: any = await prisma.$queryRawUnsafe(`SHOW FULL PROCESSLIST;`);
    
    console.log("Current Active Connections:");
    processList.forEach((p: any) => {
        console.log(`- ID: ${p.Id}, User: ${p.User}, Host: ${p.Host}, DB: ${p.db}, Command: ${p.Command}, Time: ${p.Time}, State: ${p.State}, Info: ${p.Info}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkProcessList();
