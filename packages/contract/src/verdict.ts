import { z } from "zod";

export const VoteSplitSchema = z.object({
  for: z.array(z.string()),
  against: z.array(z.string()),
  abstain: z.array(z.string()),
});
export type VoteSplit = z.infer<typeof VoteSplitSchema>;

export const DissentSchema = z.object({
  who: z.string(),
  position: z.string(),
  whyItMatters: z.string(),
});
export type Dissent = z.infer<typeof DissentSchema>;

export const VerdictSchema = z.object({
  ruling: z.string(),
  solutionPlan: z.array(z.string()).min(3).max(6),
  voteSplit: VoteSplitSchema,
  majorityReasoning: z.string(),
  dissent: DissentSchema.nullable(),
  confidence: z.number().min(0).max(1),
  whatWouldChangeOurMind: z.array(z.string()).min(2).max(3),
});
export type Verdict = z.infer<typeof VerdictSchema>;
