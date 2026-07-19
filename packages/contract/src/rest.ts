import { z } from "zod";

export const SessionSummarySchema = z.object({
  id: z.string(),
  dilemma: z.string(),
  createdAt: z.string(),
  status: z.string(),
  orb: z.object({
    hues: z.array(z.string()),
    voteSplit: z.object({
      for: z.number().int(),
      against: z.number().int(),
      abstain: z.number().int(),
    }),
  }),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;

export const SessionListResponseSchema = z.object({
  sessions: z.array(SessionSummarySchema),
});
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;
