import { chapter } from "../repositories/chapter.db"; // Adjust path to your repository instance
import { SYLLABUS_DATA } from "../utils/chapter";     // Adjust path to your data file
import { SubjectName } from "@prisma/client";

const seedDatabase = async () => {
  console.log("🚀 Starting Chapter Upload...");

  // 1. Iterate over each Group (e.g., Mechanics, Algebra)
  for (const section of SYLLABUS_DATA) {
    console.log(`\n📂 Processing: ${section.group} (${section.subject})`);

    // 2. Iterate over each Chapter in that group
    for (const ch of section.chapters) {
      try {
        // 3. Construct the Payload strictly matching 'chapterInform'
        await chapter.addingChapter({
          name: ch.name,
          chapterNumber: ch.chapterNumber,
          classNumber: ch.class,
          group: section.group,
          // Cast string subject to Prisma Enum (ensure strict match)
          subject: section.subject as SubjectName, 
          isJeeMain: ch.isJeeMain,
          isJeeAdvanced: ch.isJeeAdvanced,
          // Defaulting isCbse to true (since these are standard NCERT chapters)
          isCbse: true 
        });

        process.stdout.write("."); // Visual progress indicator
      } catch (error) {
        // Log specific errors (e.g., duplicates) but don't stop the whole script
        console.error(`\n❌ Failed to add "${ch.name}":`, error);
      }
    }
  }

  console.log("\n\n✅ Syllabus upload process completed!");
};

// Execute the function
seedDatabase()
  .catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
  });