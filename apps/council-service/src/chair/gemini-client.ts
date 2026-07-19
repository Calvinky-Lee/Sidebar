import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

let client: GoogleGenAI | undefined;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    if (!env.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set — required for live deliberations.");
    }
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

export interface GenerateJsonOptions {
  model: string;
  prompt: string;
  withSearchGrounding?: boolean;
}

export interface GroundingMetadataLike {
  webSearchQueries?: string[];
  groundingChunks?: Array<{ web?: { title?: string; uri?: string } }>;
}

export interface GenerateJsonResult {
  text: string;
  groundingMetadata?: GroundingMetadataLike;
  totalTokens: number;
}

/**
 * One structured-JSON call. `responseMimeType: 'application/json'` plus a zod parse on
 * the caller's side (fail loudly, per contract policy) rather than the SDK's own
 * responseSchema builder — keeps this wrapper stable across @google/genai versions.
 */
export async function generateJson(opts: GenerateJsonOptions): Promise<GenerateJsonResult> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: opts.model,
    contents: opts.prompt,
    config: {
      responseMimeType: "application/json",
      ...(opts.withSearchGrounding ? { tools: [{ googleSearch: {} }] } : {}),
    },
  });

  const text = response.text ?? "";
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata as
    | GroundingMetadataLike
    | undefined;
  const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;
  return { text, groundingMetadata, totalTokens };
}

/** Strips ```json fences if the model wraps its JSON in a markdown code block. */
export function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? text).trim();
}
