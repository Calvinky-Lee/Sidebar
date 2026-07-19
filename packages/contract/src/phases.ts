import { z } from "zod";

export const PhaseSchema = z.enum([
  "intake",
  "casting",
  "statements",
  "rebuttal",
  "closing",
  "verdict",
]);
export type Phase = z.infer<typeof PhaseSchema>;

export const SessionStatusSchema = z.union([PhaseSchema, z.enum(["created", "done", "failed"])]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
