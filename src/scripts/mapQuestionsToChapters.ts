import { database } from "../lib/database";
import axios from "axios";

// Parse all keys
const rawKeys = process.env.NOMIC_API_KEYS || process.env.NOMIC_API_KEY || "";
const NOMIC_API_KEYS = rawKeys.split(",").map(k => k.trim()).filter(k => k.length > 0);

if (NOMIC_API_KEYS.length === 0) {
  console.error("❌ Missing NOMIC_API_KEYS in environment variables.");
  process.exit(1);
}

let currentKeyIndex = 0;

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

// Get Nomic Embeddings with retry logic and multi-key fallback
async function getEmbeddings(texts: string[], taskType: "search_document" | "search_query" = "search_document", retries = 5): Promise<number[][]> {
  // Truncate texts to prevent huge payloads that cause Nomic to hang
  // Increased back to 10000 characters as requested
  const safeTexts = texts.map(text => text.length > 10000 ? text.substring(0, 10000) : text);

  for (let attempt = 1; attempt <= retries; attempt++) {
    const key = NOMIC_API_KEYS[currentKeyIndex];
    try {
      const response = await axios.post<any>(
        "https://api-atlas.nomic.ai/v1/embedding/text",
        {
          model: "nomic-embed-text-v1.5",
          texts: safeTexts,
          task_type: taskType
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          timeout: 20000, // Reduced to 20s so it fails faster instead of hanging for a minute
        }
      );
      return response.data.embeddings;
    } catch (error: any) {
      console.warn(`⚠️ Nomic API error (Key ${currentKeyIndex + 1}/${NOMIC_API_KEYS.length}) on attempt ${attempt}: ${error.message}`);
      
      // On failure, rotate to the next key
      currentKeyIndex = (currentKeyIndex + 1) % NOMIC_API_KEYS.length;

      if (attempt === retries) throw error;
      await sleep(1000 * attempt); // Faster retry (1s, 2s, 3s...)
    }
  }
  return [];
}

import { SYLLABUS_DATA } from "../utils/chapter";

export const mapQuestions = async () => {
  console.log("🚀 Fetching all chapters...");
  const chapters = await database.chapters.findMany();
  
  if (chapters.length === 0) {
    console.error("❌ No chapters found in DB.");
    return;
  }

  console.log(`🚀 Generating enriched embeddings for ${chapters.length} chapters...`);
  
  // Dramatically improve accuracy by injecting Syllabus Keywords into the Chapter Embedding
  const chapterTexts = chapters.map(ch => {
    let description = "";
    let keywords = "";
    
    for (const group of SYLLABUS_DATA) {
       const found = group.chapters.find(c => c.name === ch.name);
       if (found) {
          description = found.description || "";
          keywords = (found.keywords || []).join(", ");
          break;
       }
    }
  
    return `Chapter: ${ch.name} | Subject: ${ch.group} | Class: ${ch.class} | Description: ${description} | Topics & Keywords: ${keywords}`;
  });

  const chapterEmbeddings = await getEmbeddings(chapterTexts, "search_document");
  
  const chaptersWithEmbeddings = chapters.map((ch, i) => ({
    ...ch,
    embedding: chapterEmbeddings[i],
  }));

  console.log("🚀 Fetching all questions...");
  const questions = await database.questions.findMany();
  console.log(`Found ${questions.length} questions. Processing in batches of 20...`);

  let successCount = 0;
  let failCount = 0;

  const BATCH_SIZE = 20; // Lower batch size to make Nomic requests extremely fast
  
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
