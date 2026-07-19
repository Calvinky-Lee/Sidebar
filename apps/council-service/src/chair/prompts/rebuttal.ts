import { z } from "zod";
import type { CastMember, Stance } from "@council/contract";
import { StanceSchema } from "@council/contract";
import { MEMBER_MODEL } from "../model-config.js";
import { extractJsonBlock, generateJson } from "../gemini-client.js";

export const RebuttalResultSchema = z.object({
  prose: z.string(),
  stance: StanceSchema,
  bubble: z.string().max(140),
  quotedPersonaId: z.string().optional(),
});
export type RebuttalResult = z.infer<typeof RebuttalResultSchema>;

export interface OtherStance {
  personaId: string;
  name: string;
  archetype: string;
  stance: Stance;
  fullText: string;
}

/** Placeholder pending P1 (spec 04 §rebuttal.ts) — one round, per member, parallel, no tools. */
export async function runRebuttal(
  member: CastMember,
  ownStance: Stance,
  others: OtherStance[],
): Promise<RebuttalResult & { totalTokens: number }> {
  const prompt = `You are ${member.name}, "${member.archetype}". Your own stance: ${JSON.stringify(ownStance)}.

Other members' positions:
${others.map((o) => `- ${o.name} (${o.archetype}, id=${o.personaId}): ${JSON.stringify(o.stance)} — "${o.fullText}"`).join("\n")}

Address the STRONGEST opposing argument by name and quote it. You MAY update your stance —
only if genuinely moved (sycophancy is a failure mode, not agreeableness).

Respond with ONLY JSON: {"prose": string, "stance": {"recommendation": string, "confidence": 0-1, "keyReasons": string[2-4]}, "bubble": "<=140 char read of the others' positions", "quotedPersonaId": "id of the member you quoted, if any"}`;

  const { text, totalTokens } = await generateJson({ model: MEMBER_MODEL, prompt });
  return { ...RebuttalResultSchema.parse(JSON.parse(extractJsonBlock(text))), totalTokens };
}
