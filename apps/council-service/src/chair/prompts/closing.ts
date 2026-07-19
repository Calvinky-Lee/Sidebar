import { z } from "zod";
import type { CastMember, Stance } from "@council/contract";
import { StanceSchema } from "@council/contract";
import { MEMBER_MODEL } from "../model-config.js";
import { extractJsonBlock, generateJson } from "../gemini-client.js";

export const ClosingResultSchema = z.object({
  prose: z.string(),
  finalStance: StanceSchema,
  bubble: z.string().max(140),
});
export type ClosingResult = z.infer<typeof ClosingResultSchema>;

/** Placeholder pending P1 (spec 04 §closing.ts) — ≤60-word pitch to the Chair; stance locks
 *  after this (no tools; tiny fast calls). */
export async function runClosing(
  member: CastMember,
  postRebuttalStance: Stance,
  strongestOpposingPoint: string,
): Promise<ClosingResult & { totalTokens: number }> {
  const prompt = `You are ${member.name}. Your post-rebuttal stance: ${JSON.stringify(postRebuttalStance)}.
Strongest opposing point to address: ${strongestOpposingPoint}

Address the Chair directly. <=60 words. State your final recommendation and the single
strongest reason it should win. This is your last word — your stance below is now LOCKED.

Respond with ONLY JSON: {"prose": string, "finalStance": {"recommendation": string, "confidence": 0-1, "keyReasons": string[2-4]}, "bubble": "<=140 char pitch summary"}`;

  const { text, totalTokens } = await generateJson({ model: MEMBER_MODEL, prompt });
  return { ...ClosingResultSchema.parse(JSON.parse(extractJsonBlock(text))), totalTokens };
}
