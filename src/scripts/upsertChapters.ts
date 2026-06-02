import { database } from "../lib/database";
import { SYLLABUS_DATA } from "../utils/chapter";
import { SubjectName } from "@prisma/client";

export const upsertChapters = async () => {
  console.log("🚀 Starting Chapter Upsertion...");

  for (const section of SYLLABUS_DATA) {
    console.log(`\n📂 Processing Group: ${section.group} (${section.subject})`);

    const subjectInformation = await database.subjects.findUnique({
      where: {
        name: section.subject as SubjectName,
      },
    });

    if (!subjectInformation) {
      console.error(`❌ Subject "${section.subject}" not found. Skipping group.`);
      continue;
    }

    for (const ch of section.chapters) {
      try {
        const chapterClass = (ch as any).class ?? (ch as any).classNumber;

        if (chapterClass !== 11 && chapterClass !== 12) {
          throw new Error(`Invalid class value for "${ch.name}": ${chapterClass}`);
        }

        await database.chapters.upsert({
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
      } catch (error) {
        console.error(`\n❌ Failed to upsert "${ch.name}":`, error);
      }
    }
  }

  console.log("\n\n🎉 Chapter upsert process completed!");
};

// Execute the function
upsertChapters()
  .catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await database.$disconnect();
  });
