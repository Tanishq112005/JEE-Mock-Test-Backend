"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertChapters = void 0;
const database_1 = require("../lib/database");
const chapter_1 = require("../utils/chapter");
const upsertChapters = async () => {
    console.log("🚀 Starting Chapter Upsertion...");
    for (const section of chapter_1.SYLLABUS_DATA) {
        console.log(`\n📂 Processing Group: ${section.group} (${section.subject})`);
        const subjectInformation = await database_1.database.subjects.findUnique({
            where: {
                name: section.subject,
            },
        });
        if (!subjectInformation) {
            console.error(`❌ Subject "${section.subject}" not found. Skipping group.`);
            continue;
        }
        for (const ch of section.chapters) {
            try {
                const chapterClass = ch.class ?? ch.classNumber;
                if (chapterClass !== 11 && chapterClass !== 12) {
                    throw new Error(`Invalid class value for "${ch.name}": ${chapterClass}`);
                }
                await database_1.database.chapters.upsert({
                    where: { name: ch.name },
                    update: {
                        class: chapterClass,
                        chapterNumber: ch.chapterNumber,
                        subjectId: subjectInformation.id,
                        isJeeAdvanced: ch.isJeeAdvanced,
                        isJeeMain: ch.isJeeMain,
                        group: section.group,
                    },
                    create: {
                        name: ch.name,
                        class: chapterClass,
                        chapterNumber: ch.chapterNumber,
                        subjectId: subjectInformation.id,
                        isJeeAdvanced: ch.isJeeAdvanced,
                        isJeeMain: ch.isJeeMain,
                        group: section.group,
                    },
                });
                process.stdout.write("."); // Visual progress indicator
            }
            catch (error) {
                console.error(`\n❌ Failed to upsert "${ch.name}":`, error);
            }
        }
    }
    console.log("\n\n🎉 Chapter upsert process completed!");
};
exports.upsertChapters = upsertChapters;
// Execute the function
(0, exports.upsertChapters)()
    .catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
})
    .finally(async () => {
    await database_1.database.$disconnect();
});
