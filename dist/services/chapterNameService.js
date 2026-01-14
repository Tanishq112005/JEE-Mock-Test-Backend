"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeChapterEmbeddings = initializeChapterEmbeddings;
exports.findBestChapter = findBestChapter;
const chapter_1 = require("../utils/chapter");
const embedding_1 = require("../utils/embedding");
const similarity_1 = require("../utils/similarity");
const chapterEmbeddingCache = new Map();
async function initializeChapterEmbeddings() {
    console.log("Initializing chapter embeddings...");
    for (const chapter of chapter_1.CHAPTERS) {
        if (!chapterEmbeddingCache.has(chapter.slug)) {
            const textToEmbed = `${chapter.name}: ${chapter.description} (${chapter.chapterGroup})`;
            try {
                const vector = await (0, embedding_1.getEmbedding)(textToEmbed);
                chapterEmbeddingCache.set(chapter.slug, vector);
            }
            catch (error) {
                console.error(`Failed to generate embedding for ${chapter.name}:`, error);
            }
        }
    }
    console.log("Chapter embeddings initialized.");
}
async function findBestChapter(payload) {
    const { chapter, chapterGroup, subject } = payload;
    const filteredChapters = chapter_1.CHAPTERS.filter(c => c.subject.toLowerCase() === subject.toLowerCase());
    if (filteredChapters.length === 0)
        return "Unknown Chapter";
    const queryText = chapterGroup ? `${chapter} ${chapterGroup}` : chapter;
    let queryEmbedding;
    try {
        queryEmbedding = await (0, embedding_1.getEmbedding)(queryText);
    }
    catch (error) {
        console.error("Error generating query embedding:", error);
        return "Error processing request";
    }
    let bestMatch = null;
    let maxScore = -1;
    for (const ch of filteredChapters) {
        const chEmbedding = chapterEmbeddingCache.get(ch.slug);
        if (chEmbedding) {
            const score = (0, similarity_1.cosineSimilarity)(queryEmbedding, chEmbedding);
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
