"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
async function checkPayloadSize() {
    try {
        const paperIds = await database_1.database.$queryRawUnsafe(`SELECT id FROM papers LIMIT 1;`);
        if (paperIds.length === 0) {
            console.log("No papers found");
            return;
        }
        const paperId = paperIds[0].id;
        console.log(`Testing payload size for paper: ${paperId}`);
        // Fetch all questions for a paper just like getRawQuestionsForPaper does
        const paperRaw = await database_1.database.papers.findUnique({
            where: { id: paperId },
            include: {
                exam: { select: { name: true } },
                questions: {
                    include: {
                        options: true,
                        solution: true,
                        subjects: { select: { name: true } },
                        chapters: {
                            select: { name: true, isJeeAdvanced: true, isJeeMain: true },
                        },
                    },
                    orderBy: { id: "asc" },
                },
            },
        });
        if (!paperRaw) {
            console.log("Paper not found");
            return;
        }
        const payloadString = JSON.stringify(paperRaw);
        const sizeInBytes = Buffer.byteLength(payloadString, 'utf8');
        const sizeInKB = sizeInBytes / 1024;
        const sizeInMB = sizeInKB / 1024;
        console.log(`Payload Size: ${sizeInKB.toFixed(2)} KB (${sizeInMB.toFixed(2)} MB)`);
        console.log(`Estimated Egress RUs per request: ${Math.ceil(sizeInKB)} RUs`);
    }
    catch (err) {
        console.error("Error:", err);
    }
    finally {
        await database_1.database.$disconnect();
    }
}
checkPayloadSize();
