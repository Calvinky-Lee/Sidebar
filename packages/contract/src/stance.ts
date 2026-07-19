import { z } from "zod";

export const StanceSchema = z.object({
  recommendation: z.string(),
  confidence: z.number().min(0).max(1),
  keyReasons: z.array(z.string()).min(2).max(4),
});
export type Stance = z.infer<typeof StanceSchema>;
