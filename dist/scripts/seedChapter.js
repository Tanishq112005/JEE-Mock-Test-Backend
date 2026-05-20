"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const chapter_db_1 = require("../repositories/chapter.db"); // Adjust path to your repository instance
const chapter_1 = require("../utils/chapter"); // Adjust path to your data file
const seedDatabase = async () => {
    console.log("🚀 Starting Chapter Upload...");
    // 1. Iterate over each Group (e.g., Mechanics, Algebra)
    for (const section of chapter_1.SYLLABUS_DATA) {
        console.log(`\n📂 Processing: ${section.group} (${section.subject})`);
        // 2. Iterate over each Chapter in that group
        for (const ch of section.chapters) {
            try {
                // 3. Construct the Payload strictly matching 'chapterInform'
                await chapter_db_1.chapter.addingChapter({
                    name: ch.name,
                    chapterNumber: ch.chapterNumber,
                    classNumber: ch.class,
                    group: section.group,
                    // Cast string subject to Prisma Enum (ensure strict match)
                    subject: section.subject,
                    isJeeMain: ch.isJeeMain,
                    isJeeAdvanced: ch.isJeeAdvanced,
                    // Defaulting isCbse to true (since these are standard NCERT chapters)
                    isCbse: true
                });
                process.stdout.write("."); // Visual progress indicator
            }
            catch (error) {
                // Log specific errors (e.g., duplicates) but don't stop the whole script
                console.error(`\nFailed to add "${ch.name}":`, error);
            }
        }
    }
    console.log("\n\nSyllabus upload process completed!");
};
exports.seedDatabase = seedDatabase;
// Execute the function
(0, exports.seedDatabase)()
    .catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
});
