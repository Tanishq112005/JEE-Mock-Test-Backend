"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeChapterEmbeddings = initializeChapterEmbeddings;
exports.findBestChapter = findBestChapter;
const chapter_1 = require("../utils/chapter");
const embedding_1 = require("../utils/embedding");
const similarity_1 = require("../utils/similarity");
// Cache stores slug -> embedding vector
const chapterEmbeddingCache = new Map();
async function initializeChapterEmbeddings() {
    console.log("Initializing chapter embeddings...");
    // Iterate through the nested structure: Syllabus -> Groups -> Chapters
    for (const groupData of chapter_1.SYLLABUS_DATA) {
        for (const chapter of groupData.chapters) {
            // Check cache to avoid re-generating
            if (!chapterEmbeddingCache.has(chapter.slug)) {
                // We include the Group Name (e.g., "Mechanics") in the embedding text for better context
                const textToEmbed = `${chapter.name}: ${chapter.description} (${groupData.group})`;
                try {
                    const vector = await (0, embedding_1.getEmbedding)(textToEmbed);
                    chapterEmbeddingCache.set(chapter.slug, vector);
                }
                catch (error) {
                    console.error(`Failed to generate embedding for ${chapter.name}:`, error);
                }
            }
        }
    }
    console.log("Chapter embeddings initialized.");
}
async function findBestChapter(payload) {
    const { chapter, chapterGroup, subject } = payload;
    // 1. Filter Groups by Subject first
    const subjectGroups = chapter_1.SYLLABUS_DATA.filter(g => g.subject.toLowerCase() === subject.toLowerCase());
    // 2. Flatten the nested chapters into a single searchable array
    // We attach the 'group' name temporarily to help with context if needed, 
    // though strictly we just need the chapter object for the cache lookup.
    const candidateChapters = subjectGroups.flatMap(group => group.chapters.map(ch => ({ ...ch, groupName: group.group })));
    if (candidateChapters.length === 0)
        return "Unknown Chapter";
    // 3. Prepare Query Embedding
    const queryText = chapterGroup ? `${chapter} ${chapterGroup}` : chapter;
    let queryEmbedding;
    try {
        queryEmbedding = await (0, embedding_1.getEmbedding)(queryText);
    }
    catch (error) {
        console.error("Error generating query embedding:", error);
        return "Error processing request";
    }
    // 4. Find Best Match
    let bestMatch = null;
    let maxScore = -1;
    for (const ch of candidateChapters) {
        const chEmbedding = chapterEmbeddingCache.get(ch.slug);
        if (chEmbedding) {
            const score = (0, similarity_1.cosineSimilarity)(queryEmbedding, chEmbedding);
            if (score > maxScore) {
                maxScore = score;
                bestMatch = ch;
            }
        }
    }
    // 5. Threshold check (0.3 is usually a safe baseline for cosine similarity)
    if (bestMatch && maxScore > 0.3) {
        return bestMatch.name;
    }
    return "Unknown Chapter";
}
