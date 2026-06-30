"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../lib/database");
const tables = [
    "questions",
    "testStatus",
    "testQuestionAttemptStatus",
    "chapterWiseQuestionAttemptStatus",
    "bookmarkedQuestion",
    "studentProfile",
    "papers",
];
async function main() {
    for (const table of tables) {
        const count = await database_1.database.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM ${table};`);
        console.log(`\nTABLE ${table}`);
        console.log("rows:", count[0]?.count);
        const indexes = await database_1.database.$queryRawUnsafe(`SHOW INDEX FROM ${table};`);
        console.table(indexes.map((row) => ({
            key: row.Key_name,
            column: row.Column_name,
            seq: row.Seq_in_index,
            unique: row.Non_unique === 0n,
            cardinality: row.Cardinality,
        })));
    }
    const paperPayloads = await database_1.database.$queryRawUnsafe(`
    SELECT
      paperId,
      COUNT(*) AS questions,
      ROUND(SUM(
        COALESCE(LENGTH(content), 0) +
        COALESCE(LENGTH(comprehensionContent), 0) +
        COALESCE(LENGTH(CAST(image AS CHAR)), 0) +
        COALESCE(LENGTH(CAST(comprehensionImage AS CHAR)), 0) +
        COALESCE(LENGTH(CAST(correctAnswer AS CHAR)), 0)
      ) / 1024, 2) AS question_kb
    FROM questions
    GROUP BY paperId
    ORDER BY question_kb DESC
    LIMIT 10;
  `);
    console.log("\nLargest paper question payloads, question table only:");
    console.table(paperPayloads);
}
main()
    .catch((err) => {
    console.error(err);
    process.exitCode = 1;
})
    .finally(async () => {
    await database_1.database.$disconnect();
});
