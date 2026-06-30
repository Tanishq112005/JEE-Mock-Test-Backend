import { database } from "./src/lib/database";

async function main() {
  try {
    console.log("Fetching all question IDs...");
    const rawIds: any[] = await database.$queryRawUnsafe(`SELECT id FROM questions`);
    console.log(`Found ${rawIds.length} questions. Checking each with Prisma...`);

    let errorCount = 0;
    for (let i = 0; i < rawIds.length; i++) {
      const qid = rawIds[i].id;
      try {
        await database.questions.findUnique({
          where: { id: qid }
        });
      } catch (err: any) {
        if (err.message && err.message.includes("JSON") || err.message.includes("serialize")) {
          console.log(`\nFound corrupt JSON in question: ${qid}`);
          const rawData: any[] = await database.$queryRawUnsafe(`
            SELECT 
              id, 
              CAST(correctAnswer AS CHAR) as ca, 
              CAST(image AS CHAR) as img, 
              CAST(comprehensionImage AS CHAR) as ci 
            FROM questions 
            WHERE id = '${qid}'
          `);
          console.log("Raw DB Row cast to string:");
          console.log(rawData[0]);
          errorCount++;
        }
      }
    }

    console.log(`\nFinished checking all questions. Found ${errorCount} errors.`);
  } catch (error) {
    console.error("Error in script:", error);
  } finally {
    await database.$disconnect();
  }
}

main();
