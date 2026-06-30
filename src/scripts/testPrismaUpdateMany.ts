import { PrismaClient, TestState } from "@prisma/client";

async function testPrismaUpdateMany() {
  const prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
    ],
  });

  prisma.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  });

  try {
    const inactivityThresholdSeconds = 90;
    const cutoffTime = new Date(Date.now() - inactivityThresholdSeconds * 1000);
    
    console.log("Running Prisma updateMany...");
    await prisma.testStatus.updateMany({
      where: {
        status: TestState.IN_PROGRESS,
        updated_at: { lt: cutoffTime },
      },
      data: {
        status: TestState.PAUSED,
      },
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaUpdateMany();
