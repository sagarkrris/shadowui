import { GoogleGenAI } from "@google/genai";

export function createGeminiClient(apiKey) {
  return new GoogleGenAI({ apiKey });
}

export function streamChunkText(chunk) {
  if (typeof chunk?.text === "function") return chunk.text();
  return typeof chunk?.text === "string" ? chunk.text : "";
}

export function createChat(client, { model, history, systemInstruction }) {
  return client.chats.create({ model, history, config: systemInstruction ? { systemInstruction } : undefined });
}

export function generateContent(client, { model, contents, config }) {
  return client.models.generateContent({ model, contents, ...(config ? { config } : {}) });
}

export function generateContentStream(client, { model, contents, config }) {
  return client.models.generateContentStream({ model, contents, ...(config ? { config } : {}) });
}
