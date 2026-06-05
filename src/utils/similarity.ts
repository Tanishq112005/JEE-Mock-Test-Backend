import { getEmbedding } from "./embedding";
import { SYLLABUS_DATA, SyllabusGroup, Chapter, Subject } from "./chapter"; 

// ==========================================
// 1. MATHEMATICAL UTILITIES
// ==========================================

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * FIXED TOKENIZER:
 * Added "chemistry", "physics", "mathematics" to stopWords.
 * This prevents "Environmental Chemistry" from winning just because the query says "Chemistry".
 */
function tokenize(text: string): Set<string> {
  const stopWords = new Set([
    "the", "and", "is", "of", "in", "to", "for", "with", "on", "at", "by", "from", 
    "chapter", "class", "question", "questions", "topic",
    // 🛑 CRITICAL FIX: Ignore subject names in keyword matching
    "physics", "chemistry", "mathematics", "maths", "math" 
  ]);

  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  return new Set(tokens);
}

// ==========================================
// 2. SEARCH ENGINE (HYBRID LOGIC)
// ==========================================

interface IndexedChapter extends Chapter {
  subject: Subject;
  group: string;
  embedding: number[]; 
  searchContext: string;
}

export class ChapterSearchEngine {
  private index: IndexedChapter[] = [];
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log("Initializing Search Index...");
    const startTime = Date.now();
    const tasks: { group: SyllabusGroup, chapter: Chapter }[] = [];

    for (const group of SYLLABUS_DATA) {
      for (const chapter of group.chapters) {
        tasks.push({ group, chapter });
      }
    }

    // Batch requests to prevent rate limiting / timeouts
    
    // const BATCH_SIZE = 5;
    // for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    //  const chunk = tasks.slice(i, i + BATCH_SIZE);
    //  await Promise.all(chunk.map(t => this.indexChapter(t.group, t.chapter)));
    //  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between batches
   // }
    
    //this.isInitialized = true;
    // console.log(`Index Ready! Loaded ${this.index.length} chapters in ${(Date.now() - startTime) / 1000}s`);
  }
  
  private async indexChapter(group: SyllabusGroup, chapter: Chapter) {
    const richText = `
      Subject: ${group.subject}. 
      Chapter: ${chapter.name}. 
      Keywords: ${chapter.keywords?.join(", ") || ""}. 
      Description: ${chapter.description}
    `.replace(/\s+/g, ' ').trim();
    
    const embedding = await getEmbedding(richText);

    if (embedding.length > 0) {
      this.index.push({
        ...chapter,
        subject: group.subject,
        group: group.group,
        embedding,
        searchContext: richText.toLowerCase()
      });
    }
  }

  async findChapter(query: string, limit: number = 3) {
    if (!this.isInitialized) {
        console.warn("Search Engine not initialized. Calling initialize() now...");
        await this.initialize();
    }

    const queryEmbedding = await getEmbedding(query);
    const queryTokens = tokenize(query);

    const results = this.index.map(chapter => {
      
      // 1. Vector Score (Meaning)
      const vectorScore = cosineSimilarity(queryEmbedding, chapter.embedding);

      // 2. Keyword Score (Exact Matches)
      let keywordMatches = 0;
      
      // A. Subject Check (Hard Filter Bonus)
      // We manually check if the query mentions the subject, but we DON'T use the tokenizer for this specific check
      // to avoid the "Environmental Chemistry" trap.
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes(chapter.subject.toLowerCase())) {
          keywordMatches += 3; 
      }

      // B. Name Match (The most important)
      tokenize(chapter.name).forEach(t => { 
          if (queryTokens.has(t)) keywordMatches += 5; // Boosted this up
      });

      // C. Keyword/Description Match
      if (chapter.keywords) {
        chapter.keywords.forEach(k => {
            // Tokenize the keyword phrase (e.g. "mole concept")
            tokenize(k).forEach(t => {
                if (queryTokens.has(t)) keywordMatches += 3;
            });
        });
      }

      // Normalize Keyword Score (Max 1.0)
      const keywordScore = Math.min(keywordMatches / 15, 1.0);

      // 3. Final Score
      const finalScore = (vectorScore * 0.6) + (keywordScore * 0.4);

      return {
        ...chapter,
        matchDetails: {
            vector: vectorScore.toFixed(2),
            keyword: keywordScore.toFixed(2),
            total: finalScore.toFixed(2)
        },
        score: finalScore
      };
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const searchEngine = new ChapterSearchEngine();