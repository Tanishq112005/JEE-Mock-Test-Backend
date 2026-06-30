"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function testPrismaUpdateMany() {
    const prisma = new client_1.PrismaClient({
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
                status: client_1.TestState.IN_PROGRESS,
                updated_at: { lt: cutoffTime },
            },
            data: {
                status: client_1.TestState.PAUSED,
            },
        });
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await prisma.$disconnect();
    }
}
testPrismaUpdateMany();
