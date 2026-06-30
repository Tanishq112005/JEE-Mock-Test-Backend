import { database as prisma } from "../lib/database";

async function checkPayloadSize() {
  try {
    const paperIds = await prisma.$queryRawUnsafe(`SELECT id FROM papers LIMIT 1;`);
    if ((paperIds as any).length === 0) {
      console.log("No papers found");
      return;
    }
    const paperId = (paperIds as any)[0].id;
    
    console.log(`Testing payload size for paper: ${paperId}`);
    
    // Fetch all questions for a paper just like getRawQuestionsForPaper does
    const paperRaw: any = await prisma.papers.findUnique({
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
    
  } catch (err: any) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPayloadSize();
