import { z } from "zod";
import type { CastMember } from "@council/contract";
import { StanceSchema } from "@council/contract";
import { MEMBER_MODEL } from "../model-config.js";
import { extractJsonBlock, generateJson } from "../gemini-client.js";

export const StatementResultSchema = z.object({
  prose: z.string(),
  stance: StanceSchema,
  bubble: z.string().max(140),
});
export type StatementResult = z.infer<typeof StatementResultSchema>;

/** Placeholder pending P1 (spec 04 §statement.ts) — opening statement, per member, parallel.
 *  Google Search grounding is enabled; grounding results are read from the returned
 *  `groundingMetadata` by the orchestrator and mapped to `tool_call`/`tool_result` (spec 06). */
export async function runOpeningStatement(
  member: CastMember,
  parsedDilemma: string,
) {
  const prompt = `You are ${member.name}, "${member.archetype}". Voice: ${member.voice}.
Core values: ${member.stanceProfile.coreValues.join(", ")}. Biases: ${member.stanceProfile.biases.join(", ")}.
Situation brief: ${member.situationBrief ?? ""}

Dilemma: ${parsedDilemma}

Give your opening statement (120-200 words, in voice, personality in word choice not length).
Search when a verifiable fact would strengthen your argument. Then give a structured stance.

Respond with ONLY JSON: {"prose": string, "stance": {"recommendation": string, "confidence": 0-1, "keyReasons": string[2-4]}, "bubble": "<=140 char first-person opinion summary"}`;

  const { text, groundingMetadata, totalTokens } = await generateJson({
    model: MEMBER_MODEL,
    prompt,
    withSearchGrounding: true,
  });
  const result = StatementResultSchema.parse(JSON.parse(extractJsonBlock(text)));
  return { result, groundingMetadata, totalTokens };
}
