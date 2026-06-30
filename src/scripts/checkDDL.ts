import { database as prisma } from "../lib/database";

async function checkDDL() {
  try {
    const jobs: any = await prisma.$queryRawUnsafe(`ADMIN SHOW DDL JOBS;`);
    const activeJobs = jobs.filter((job: any) => job.STATE !== 'synced' && job.STATE !== 'cancelled');
    console.log("Active DDL Jobs:", activeJobs);
  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDDL();
