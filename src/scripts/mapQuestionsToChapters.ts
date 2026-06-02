import { database } from "../lib/database";
import axios from "axios";

const NOMIC_API_KEY = process.env.NOMIC_API_KEY;

if (!NOMIC_API_KEY) {
  console.error("❌ Missing NOMIC_API_KEY in environment variables.");
  process.exit(1);
}

// Compute Cosine Similarity
function cosineSimilarity(A: number[], B: number[]) {
  let dotproduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < A.length; i++) {
    dotproduct += A[i] * B[i];
    mA += A[i] * A[i];
    mB += B[i] * B[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotproduct / (mA * mB);
}

// Sleep for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get Nomic Embeddings with retry logic
async function getEmbeddings(texts: string[], taskType: "search_document" | "search_query" = "search_document", retries = 3): Promise<number[][]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post<any>(
        "https://api-atlas.nomic.ai/v1/embedding/text",
        {
          model: "nomic-embed-text-v1.5",
          texts: texts,
          task_type: taskType
        },
        {
          headers: {
            Authorization: `Bearer ${NOMIC_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10s timeout
        }
      );
      return response.data.embeddings;
    } catch (error: any) {
      console.warn(`⚠️ Nomic API error on attempt ${attempt}: ${error.message}`);
      if (attempt === retries) throw error;
      await sleep(2000 * attempt); // Exponential backoff
    }
  }
  return [];
}

export const mapQuestions = async () => {
  console.log("🚀 Fetching all chapters...");
  const chapters = await database.chapters.findMany();
  
  if (chapters.length === 0) {
    console.error("❌ No chapters found in DB.");
    return;
  }

  console.log(`🚀 Generating embeddings for ${chapters.length} chapters...`);
  const chapterTexts = chapters.map(ch => `${ch.name} ${ch.group} ${ch.class}`);
  const chapterEmbeddings = await getEmbeddings(chapterTexts, "search_document");
  
  const chaptersWithEmbeddings = chapters.map((ch, i) => ({
    ...ch,
    embedding: chapterEmbeddings[i],
  }));

  console.log("🚀 Fetching all questions...");
  const questions = await database.questions.findMany();
  console.log(`Found ${questions.length} questions. Processing in batches of 100...`);

  let successCount = 0;
  let failCount = 0;

  const BATCH_SIZE = 50;
  
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    console.log(`\n📝 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(questions.length / BATCH_SIZE)} (Questions ${i + 1} to ${i + batch.length})`);
    
    try {
      // 1. Generate embeddings for the entire batch at once
      const batchTexts = batch.map(q => q.content);
      const batchEmbeddings = await getEmbeddings(batchTexts, "search_query");

      // 2. Process each question in the batch locally
      const updates = [];
      for (let j = 0; j < batch.length; j++) {
        const q = batch[j];
        const qEmbedding = batchEmbeddings[j];

        // Filter chapters by subject
        const subjectChapters = chaptersWithEmbeddings.filter(ch => ch.subjectId === q.subjectId);
        if (subjectChapters.length === 0) {
          failCount++;
          continue;
        }

        // Find the best chapter using pure Cosine Similarity
        let bestChapter = subjectChapters[0];
        let maxScore = -1;

        for (const ch of subjectChapters) {
          const score = cosineSimilarity(qEmbedding, ch.embedding);
          if (score > maxScore) {
            maxScore = score;
            bestChapter = ch;
          }
        }

        updates.push({
          id: q.id,
          chapterId: bestChapter.id
        });
      }

      // 3. Batch update the database concurrently (20 updates won't overload the pool of 50)
      const updatePromises = updates.map(update => 
        database.questions.update({
          where: { id: update.id },
          data: { chapterId: update.chapterId }
        })
      );
      await Promise.all(updatePromises);
      
      successCount += updates.length;
      console.log(`✅ Successfully assigned ${updates.length} questions in this batch.`);
      
      // Minimal pause to avoid Nomic rate limits
      await sleep(100);

    } catch (err: any) {
      console.error(`❌ Error processing batch starting at index ${i}:`, err?.response?.data || err.message);
      failCount += batch.length;
    }
  }

  console.log(`\n\n🎉 Migration Complete! Success: ${successCount}, Failed: ${failCount}`);
};

mapQuestions()
  .catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await database.$disconnect();
  });
