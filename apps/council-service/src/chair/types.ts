import { z } from 'zod';
import {
  StanceSchema,
  VerdictSchema,
  PhaseSchema,
  SessionStatusSchema,
  type Stance,
  type Verdict,
  type Phase,
  type SessionStatus,
} from '@council/contract';

// Stance/Verdict/Phase/SessionStatus now come from the real @council/contract
// package (landed at hour 0) — re-exported here so every chair/ file can keep
// importing from './types.js' without churn. This file's own schemas below
// (IntakeResult, PersonaForBrief, SituationBrief, MemberPhaseOutput,
// CastMemberLite) have no contract equivalent and stay local.
export { StanceSchema, VerdictSchema, PhaseSchema, SessionStatusSchema };
export type { Stance, Verdict, Phase, SessionStatus };

// Derived from the real schema rather than duplicated — no drift risk.
export const PHASES = PhaseSchema.options;

// Just enough persona shape to build prompts without depending on P2's full
// persona/casting system (spec 05 owns the real thing).
export const CastMemberLiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  archetype: z.string(),
});
export type CastMemberLite = z.infer<typeof CastMemberLiteSchema>;

export interface MemberTranscript {
  statement: string;
  rebuttal: string;
  closing: string;
}

// Intake output (spec 04 §intake.ts). Note: the contract's `dilemma_parsed` SSE
// payload (spec 02) only carries `summary`/`axesOfTension`/`councilSize` —
// `decisionType` is used internally (eval-set categorization) and isn't emitted.
// Flag for hour-0 reconciliation if that changes.
export const IntakeResultSchema = z.object({
  summary: z.string().min(1),
  axesOfTension: z.array(z.string().min(1)).min(2).max(6),
  decisionType: z.string().min(1),
  councilSize: z.number().int().min(3).max(6),
});
export type IntakeResult = z.infer<typeof IntakeResultSchema>;

// Full-enough persona shape for the situation-brief prompt: identity fields
// (CastMemberLite) plus the stance-profile fields spec 05 owns for real
// (P2's persona/casting system). This is a local stand-in, same caveat as
// CastMemberLite above.
export interface PersonaForBrief extends CastMemberLite {
  voice: string;
  coreValues: string[];
  biases: string[];
  decisionStyle: string;
}

// Situation-brief output (spec 04 §brief.ts).
export const SituationBriefSchema = z.object({
  brief: z.string().min(1),
  // "Bubble rule": every member phase's structured output includes a first-person,
  // in-voice ≤140-char summary — for the brief, this becomes the member's very
  // first thinking bubble (persona_cast.initialRead).
  initialRead: z.string().min(1).max(140),
});
export type SituationBrief = z.infer<typeof SituationBriefSchema>;

// Shared structured output for statement/rebuttal/closing — mirrors the
// statement_done/rebuttal_done/closing_done event payloads (spec 02): the full
// in-voice prose, the structured Stance, and spec 04's "bubble rule" — a
// first-person ≤140-char summary for the UI's thinking bubble.
export const MemberPhaseOutputSchema = StanceSchema.extend({
  fullText: z.string().min(1),
  bubble: z.string().min(1).max(140),
});
export type MemberPhaseOutput = z.infer<typeof MemberPhaseOutputSchema>;
