import { PrismaClient } from "@prisma/client";
import { question } from "../src/repositories/question.db";
import { SYLLABUS_DATA } from "../src/utils/chapter";
import { database } from "../src/lib/database";

const BATCH_SIZE = 50; // Fetches 50 at a time and loops!
const OLLAMA_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "llava"; // Using llava because Llama 3.2 Vision has a bugged model file on Windows

function extractImageUrls(htmlContent: string): string[] {
  if (!htmlContent) return [];
  const regex = /<img[^>]+src="([^">]+)"/g;
  let match;
  const urls: string[] = [];
  while ((match = regex.exec(htmlContent)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  } catch (error) {
    console.error(`Error downloading image ${url}:`, error);
    return null;
  }
}

async function startProcessing() {
  let totalProcessed = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`\n=================================================`);
    console.log(`Fetching next batch of ${BATCH_SIZE} questions...`);
    
    const unprocessedQuestions = await database.questions.findMany({
      where: { isProcessingDone: false },
      take: BATCH_SIZE,
      include: { chapters: true }
    });

    if (unprocessedQuestions.length === 0) {
      console.log("\n🎉 ALL QUESTIONS PROCESSED SUCCESSFULLY!");
      hasMore = false;
      break;
    }

    for (const rawQ of unprocessedQuestions) {
      console.log(`-------------------------------------------------`);
      console.log(`Processing Question ID: ${rawQ.id} (Total Done so far: ${totalProcessed})`);
      const oldChapterName = rawQ.chapters?.name || "None";

      try {
        const qRecord = await question.getQuestionByIdWithSignedUrls(rawQ.id);
        if (!qRecord) {
            // Mark as processed so it doesn't get stuck in a loop
            await database.questions.update({ where: { id: rawQ.id }, data: { isProcessingDone: true } });
            continue;
        }

        const textsToSearch = [
          qRecord.content,
          qRecord.comprehensionContent,
          qRecord.options?.optionAtext,
          qRecord.options?.optionBtext,
          qRecord.options?.optionCtext,
          qRecord.options?.optionDtext,
          qRecord.solution?.text
        ];
        const allHtml = textsToSearch.filter(Boolean).join(" ");
        const imageUrls = extractImageUrls(allHtml);
        const base64Images: string[] = [];

        for (const url of imageUrls) {
          const b64 = await fetchImageAsBase64(url);
          if (b64) base64Images.push(b64);
        }

        const subjectName = qRecord.subject || "Unknown";
        let validChapters = SYLLABUS_DATA.flatMap((g) => g.chapters.map((c) => c.name));
        if (subjectName !== "Unknown") {
           validChapters = SYLLABUS_DATA.filter((g) => g.subject.toLowerCase() === subjectName.toLowerCase())
                                        .flatMap((g) => g.chapters.map((c) => c.name));
        }

        const promptText = `
You are an expert JEE teacher classifying questions into chapters.
Please look at the following question and classify it into EXACTLY ONE of the following chapters:

${JSON.stringify(validChapters)}

### Context Data:
- Subject: ${subjectName}
- Question Type: ${qRecord.type}
- Exam: ${qRecord.exam || "Unknown"}

### Main Question Text / Comprehension:
${qRecord.content || ""}
${qRecord.comprehensionContent ? "\nComprehension Data:\n" + qRecord.comprehensionContent : ""}

### Options:
Option A: ${qRecord.options?.optionAtext || "N/A"}
Option B: ${qRecord.options?.optionBtext || "N/A"}
Option C: ${qRecord.options?.optionCtext || "N/A"}
Option D: ${qRecord.options?.optionDtext || "N/A"}

### Solution/Explanation:
${qRecord.solution?.text || "N/A"}

Return ONLY a valid JSON object with a single key "chapterName". Example: { "chapterName": "${validChapters[0] || "Electrostatics"}" }
Do not output any markdown or thinking. Just the JSON object.
`;

        console.log(`Sending to Ollama with ${base64Images.length} images...`);
        const response = await fetch(OLLAMA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: promptText,
            images: base64Images.length > 0 ? base64Images : undefined,
            format: "json",
            stream: false,
            options: {
              num_ctx: 16384 // Increased context to handle 6+ images!
            }
          }),
        });

        const result = await response.json();
      
        if (result.error) {
           console.error(`❌ Ollama API Error: ${result.error}`);
           continue; // We DO NOT mark true here, so you can retry the crashed ones later
        }
        if (!result.response) {
           console.error(`❌ Ollama returned empty response.`);
           continue;
        }

        let newChapterName;
        try {
          const parsed = JSON.parse(result.response.trim());
          newChapterName = parsed.chapterName;
        } catch (parseError) {
          console.error(`❌ Failed to parse JSON from Ollama.`);
          // Mark as true so it doesn't infinite loop on a bad LLM response
          await database.questions.update({ where: { id: rawQ.id }, data: { isProcessingDone: true } });
          continue;
        }
        
        if (!newChapterName) {
           console.error(`❌ Ollama didn't return a 'chapterName' key.`);
           await database.questions.update({ where: { id: rawQ.id }, data: { isProcessingDone: true } });
           continue;
        } 

        const newChapterDb = await database.chapters.findUnique({
          where: { name: newChapterName }
        });

        if (!newChapterDb) {
          console.warn(`⚠️ Ollama guessed invalid chapter: '${newChapterName}'. Marking as processed to prevent infinite loops...`);
          await database.questions.update({
            where: { id: rawQ.id },
            data: { isProcessingDone: true },
          });
          totalProcessed++;
          continue;
        }

        // Successfully update chapter
        await database.questions.update({
          where: { id: rawQ.id },
          data: {
            chapterId: newChapterDb.id,
            isProcessingDone: true,
          },
        });

        totalProcessed++;
        console.log(`✅ Success!`);
        console.log(`   - Previous chapter: ${oldChapterName}`);
        console.log(`   - New classified chapter: ${newChapterName}`);

      } catch (error) {
        console.error(`❌ Failed to process question ${rawQ.id}:`, error);
        await database.questions.update({
          where: { id: rawQ.id },
          data: { isProcessingDone: true },
        });
        totalProcessed++;
      }
    }
  }
}

startProcessing()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
