import fetch from "node-fetch";

/**
 * Fetches the vector embedding for a given text string from the local Ollama instance.
 * @param text The string to embed.
 * @returns An array of numbers representing the vector.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    // 1. Setup Timeout (Aborts request after 5 seconds to prevent hanging)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 2. Call Ollama API
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const response = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text", // Make sure you ran `ollama pull nomic-embed-text`
        prompt: text
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.embedding;

  } catch (err) {
    console.error("Embedding Generation Failed:", err);
    return []; // Return empty vector so the app doesn't crash
  }
}