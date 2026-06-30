import { database } from "./src/lib/database";

async function main() {
  const qid = 'cc36951f-a378-4863-b724-3179f7daf92c';
  try {
    console.log("Trying findUnique without JSON columns...");
    const q1 = await database.questions.findUnique({
      where: { id: qid },
      select: {
        id: true,
        type: true,
        positiveMarks: true,
        negativeMarks: true,
        subjects: true,
        chapters: true,
        papers: { include: { exam: true } }
      }
    });
    console.log("q1 success:", q1?.id);

    console.log("Trying queryRaw with CAST...");
    const q2: any = await database.$queryRawUnsafe(`SELECT CAST(correctAnswer AS CHAR) as correctAnswer FROM questions WHERE id = '${qid}'`);
    console.log("q2 success:", q2[0].correctAnswer);

  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await database.$disconnect();
  }
}

main();
