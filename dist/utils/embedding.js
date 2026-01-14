"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbedding = getEmbedding;
const node_fetch_1 = __importDefault(require("node-fetch"));
async function getEmbedding(text) {
    const response = await (0, node_fetch_1.default)("http://localhost:11434/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "nomic-embed-text",
            prompt: text
        })
    });
    const data = await response.json();
    return data.embedding;
}
