import fetch from "node-fetch";
import { NOMIC_API_KEY } from "../config/env";

/**
 * Fetches the vector embedding for a given text string from the Nomic API.
 * @param text The string to embed.
 * @returns An array of numbers representing the vector.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    // 1. Setup Timeout (Aborts request after 5 seconds to prevent hanging)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 2. Setup API Key
    const nomicApiKey = NOMIC_API_KEY;
    if (!nomicApiKey) {
      throw new Error("Missing NOMIC_API_KEY environment variable.");
    }

    // 3. Call Nomic API
    const response = await fetch("https://api-atlas.nomic.ai/v1/embedding/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${nomicApiKey}`
      },
      body: JSON.stringify({
        model: "nomic-embed-text-v1.5", 
        texts: [text], 
        task_type: "search_document" 
      }),
      signal: controller.signal as any 
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Nomic API Error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    
    // Nomic returns an array of embeddings matching the 'texts' array provided
    return data.embeddings[0];

  } catch (err) {
    console.error("Embedding Generation Failed:", err);
    return []; // Return empty vector so the app doesn't crash
  }
}