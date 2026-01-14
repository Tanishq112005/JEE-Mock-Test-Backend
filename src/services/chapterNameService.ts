import { CHAPTERS, ChapterMeta, Subject } from "../utils/chapter";
import { getEmbedding } from "../utils/embedding";
import { cosineSimilarity } from "../utils/similarity";

interface FindChapterPayload {
  chapter: string;       
  chapterGroup?: string; 
  subject: Subject;      
}


const chapterEmbeddingCache = new Map<string, number[]>();


export async function initializeChapterEmbeddings() {
  console.log("Initializing chapter embeddings...");
  
  for (const chapter of CHAPTERS) {
    if (!chapterEmbeddingCache.has(chapter.slug)) {
      
      const textToEmbed = `${chapter.name}: ${chapter.description} (${chapter.chapterGroup})`;
      
      try {
        const vector = await getEmbedding(textToEmbed);
        chapterEmbeddingCache.set(chapter.slug, vector);
      } catch (error) {
        console.error(`Failed to generate embedding for ${chapter.name}:`, error);
      }
    }
  }
  console.log("Chapter embeddings initialized.");
}

export async function findBestChapter(payload: FindChapterPayload): Promise<string> {
  const { chapter, chapterGroup, subject } = payload;


  const filteredChapters = CHAPTERS.filter(
    c => c.subject.toLowerCase() === subject.toLowerCase()
  );

  if (filteredChapters.length === 0) return "Unknown Chapter";

  const queryText = chapterGroup ? `${chapter} ${chapterGroup}` : chapter;
  let queryEmbedding: number[];

  try {
    queryEmbedding = await getEmbedding(queryText);
  } catch (error) {
    console.error("Error generating query embedding:", error);
  
    return "Error processing request";
  }

  let bestMatch: ChapterMeta | null = null;
  let maxScore = -1;

  for (const ch of filteredChapters) {
  
    const chEmbedding = chapterEmbeddingCache.get(ch.slug);
    
    if (chEmbedding) {
      const score = cosineSimilarity(queryEmbedding, chEmbedding);
    

      if (score > maxScore) {
        maxScore = score;
        bestMatch = ch;
      }
    }
  }

  
  if (bestMatch && maxScore > 0.3) {
    return bestMatch.name;
  }

  return "Unknown Chapter";
}