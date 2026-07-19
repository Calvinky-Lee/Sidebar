import { randomUUID } from "node:crypto";
import type { CastMember, Stance } from "@council/contract";
import type { Emit } from "../events/emitter.js";
import { castCouncil } from "../casting/cast-council.js";
import { POOL_SIZE } from "../casting/retrieve.js";
import { GeminiModelClient } from "./model-client.js";
import { MEMBER_MODEL, VERDICT_MODEL } from "./model-config.js";
import { runIntake } from "./prompts/intake.js";
import { runBrief } from "./prompts/brief.js";
import type { PersonaForBrief } from "./types.js";
import { runOpeningStatement } from "./prompts/statement.js";
import { runRebuttal, type OtherStance } from "./prompts/rebuttal.js";
import { runClosing } from "./prompts/closing.js";
import { runVerdict, type VerdictPromptInput } from "./prompts/verdict.js";
import { MIN_ACTIVE_MEMBERS, shouldFailFromRecusals } from "./state-machine.js";
import { extractGroundingResult, summarizeWebSearchResult } from "../tools/web-search.js";
import { withTimeout, TimeoutError } from "../util/timeout.js";
import { withRateLimitBackoff } from "../util/retry.js";
import { CostTracker, estimateCostUsd } from "../metrics/cost-tracker.js";
import { env } from "../config/env.js";

const MEMBER_PHASE_TIMEOUT_MS = 45_000;
const CLOSING_PHASE_TIMEOUT_MS = 15_000;

interface MemberState {
  member: CastMember; // wire shape (no embedding) — situationBrief filled after casting
  brief: PersonaForBrief; // chair-side shape used to build prompts
  stance?: Stance;
  statementText: string;
  rebuttalText: string;
  closingText: string;
  recused: boolean;
}

/**
 * Orchestrator (spec 04 §Orchestration) — imports only the public APIs of casting/,
 * tools/, and the chair prompt modules, never their internals. Calls P1's real
 * intake/brief/verdict prompts and P2's real casting; statement/rebuttal/closing
 * prompts are this file's own (P1 hasn't built those yet — spec 04 items 6-8).
 */
export async function runDeliberation(
  sessionId: string,
  dilemma: string,
  context: string | undefined,
  emit: Emit,
): Promise<void> {
  const startedAt = Date.now();
  const cost = new CostTracker();
  let firstCastMs = -1;
  let firstTokenMs = -1;
  let recusals = 0;

  const noteCost = (model: string, totalTokens: number) => {
    cost.add(estimateCostUsd(model, totalTokens));
  };

  async function costCapBreached(): Promise<boolean> {
    if (cost.exceedsCap(env.costCapUsd)) {
      await emit({
        type: "error",
        payload: {
          message: `session exceeded the $${env.costCapUsd} cost cap`,
          fatal: true,
        },
      });
      return true;
    }
    return false;
  }

  const fastModel = new GeminiModelClient(env.geminiApiKey, MEMBER_MODEL);
  const strongModel = new GeminiModelClient(env.geminiApiKey, VERDICT_MODEL);

  await emit({ type: "session_started", payload: { dilemma, context } });

  // ---- 1. intake ----
  const intake = await withRateLimitBackoff(() => runIntake(fastModel, dilemma, context));
  const parsedDilemma = intake.summary;
  await emit({
    type: "dilemma_parsed",
    payload: {
      summary: intake.summary,
      axesOfTension: intake.axesOfTension,
      councilSize: intake.councilSize,
    },
  });
  if (await costCapBreached()) return;

  // ---- 2. casting (P2) ----
  const casting = await castCouncil(parsedDilemma, intake.councilSize);
  await emit({
    type: "casting_started",
    payload: { poolSize: POOL_SIZE, councilSize: intake.councilSize },
  });

  const memberStates: MemberState[] = [];
  let runningDiversity = 0;
  for (let seat = 0; seat < casting.members.length; seat++) {
    const seated = casting.members[seat]!;
    const brief: PersonaForBrief = {
      id: seated.id,
      name: seated.name,
      archetype: seated.archetype,
      voice: seated.voice,
      coreValues: seated.stanceProfile.coreValues,
      biases: seated.stanceProfile.biases,
      decisionStyle: seated.stanceProfile.decisionStyle,
    };
    const briefResult = await withRateLimitBackoff(() => runBrief(fastModel, brief, intake));

    const member: CastMember = {
      id: seated.id,
      name: seated.name,
      archetype: seated.archetype,
      avatar: seated.avatar as CastMember["avatar"],
      voice: seated.voice,
      domains: seated.domains,
      stanceProfile: seated.stanceProfile,
      seat,
      mmrScore: seated.mmrScore,
      situationBrief: briefResult.brief,
    };

    if (firstCastMs === -1) firstCastMs = Date.now() - startedAt;
    // running diversity: cumulative diversity of the cast so far, seat-scaled toward
    // the final cast score (P2 only computes the whole-cast score, not per-prefix).
    runningDiversity = (casting.diversityScore * (seat + 1)) / casting.members.length;
    await emit({
      type: "persona_cast",
      payload: {
        member,
        seat,
        runningDiversityScore: runningDiversity,
        initialRead: briefResult.initialRead,
      },
    });
    memberStates.push({
      member,
      brief,
      statementText: "",
      rebuttalText: "",
      closingText: "",
      recused: false,
    });
  }

  await emit({
    type: "casting_done",
    payload: {
      diversityScore: casting.diversityScore,
      baselineRatio: casting.baselineRatio,
      vectorMap: casting.vectorMap,
    },
  });
  if (await costCapBreached()) return;

  // ---- 3. opening statements ----
  await Promise.allSettled(
    memberStates.map(async (state) => {
      await emit({
        type: "statement_started",
        payload: { personaId: state.member.id, phase: "opening" },
      });
      try {
        const { result, groundingMetadata, totalTokens } = await withTimeout(
          () => withRateLimitBackoff(() => runOpeningStatement(state.member, parsedDilemma)),
          MEMBER_PHASE_TIMEOUT_MS,
          `statement:${state.member.id}`,
        );
        noteCost(MEMBER_MODEL, totalTokens);

        if (firstTokenMs === -1) firstTokenMs = Date.now() - startedAt;
        await emit({
          type: "statement_delta",
          payload: { personaId: state.member.id, text: result.prose },
        });

        const { queries, result: searchResult } = extractGroundingResult(groundingMetadata);
        if (queries.length > 0) {
          const callId = randomUUID();
          await emit({
            type: "tool_call",
            payload: {
              personaId: state.member.id,
              tool: "web_search",
              input: { queries },
              callId,
            },
          });
          await emit({
            type: "tool_result",
            payload: {
              personaId: state.member.id,
              callId,
              summary: summarizeWebSearchResult(searchResult),
            },
          });
        }

        state.statementText = result.prose;
        state.stance = result.stance;
        await emit({
          type: "statement_done",
          payload: {
            personaId: state.member.id,
            stance: result.stance,
            fullText: result.prose,
            bubble: result.bubble,
          },
        });
      } catch (err) {
        state.recused = true;
        recusals++;
        await emit({
          type: "agent_recused",
          payload: {
            personaId: state.member.id,
            reason: err instanceof TimeoutError ? "timeout" : "error",
          },
        });
      }
    }),
  );

  let active = memberStates.filter((s) => !s.recused);
  if (shouldFailFromRecusals(memberStates.length, recusals)) {
    await emit({
      type: "error",
      payload: { message: "too many recusals in opening statements", fatal: true },
    });
    return;
  }
  if (await costCapBreached()) return;

  // ---- 4. rebuttal round ----
  await Promise.allSettled(
    active.map(async (state) => {
      await emit({ type: "rebuttal_started", payload: { personaId: state.member.id } });
      try {
        const others: OtherStance[] = active
          .filter((o) => o.member.id !== state.member.id)
          .map((o) => ({
            personaId: o.member.id,
            name: o.member.name,
            archetype: o.member.archetype,
            stance: o.stance as Stance,
            fullText: o.statementText,
          }));

        const result = await withTimeout(
          () => withRateLimitBackoff(() => runRebuttal(state.member, state.stance as Stance, others)),
          MEMBER_PHASE_TIMEOUT_MS,
          `rebuttal:${state.member.id}`,
        );
        noteCost(MEMBER_MODEL, result.totalTokens);

        await emit({
          type: "rebuttal_delta",
          payload: { personaId: state.member.id, text: result.prose },
        });

        const previousStance = state.stance as Stance;
        state.rebuttalText = result.prose;
        await emit({
          type: "rebuttal_done",
          payload: {
            personaId: state.member.id,
            quotedPersonaId: result.quotedPersonaId,
            fullText: result.prose,
            bubble: result.bubble,
          },
        });

        if (result.stance.recommendation !== previousStance.recommendation) {
          state.stance = result.stance;
          await emit({
            type: "stance_updated",
            payload: { personaId: state.member.id, from: previousStance, to: result.stance },
          });
        }
      } catch (err) {
        state.recused = true;
        recusals++;
        await emit({
          type: "agent_recused",
          payload: {
            personaId: state.member.id,
            reason: err instanceof TimeoutError ? "timeout" : "error",
          },
        });
      }
    }),
  );

  active = active.filter((s) => !s.recused);
  if (shouldFailFromRecusals(memberStates.length, recusals)) {
    await emit({
      type: "error",
      payload: { message: "too many recusals in the rebuttal round", fatal: true },
    });
    return;
  }
  if (await costCapBreached()) return;

  // ---- 5. closing pitches ----
  await Promise.allSettled(
    active.map(async (state) => {
      await emit({ type: "closing_started", payload: { personaId: state.member.id } });
      try {
        const strongestOpposingPoint =
          active.find((o) => o.member.id !== state.member.id)?.rebuttalText ??
          "no opposing view survived to this round";

        const result = await withTimeout(
          () =>
            withRateLimitBackoff(() =>
              runClosing(state.member, state.stance as Stance, strongestOpposingPoint),
            ),
          CLOSING_PHASE_TIMEOUT_MS,
          `closing:${state.member.id}`,
        );
        noteCost(MEMBER_MODEL, result.totalTokens);

        await emit({
          type: "closing_delta",
          payload: { personaId: state.member.id, text: result.prose },
        });

        state.closingText = result.prose;
        state.stance = result.finalStance; // locked
        await emit({
          type: "closing_done",
          payload: {
            personaId: state.member.id,
            finalStance: result.finalStance,
            fullText: result.prose,
            bubble: result.bubble,
          },
        });
      } catch (err) {
        state.recused = true;
        recusals++;
        await emit({
          type: "agent_recused",
          payload: {
            personaId: state.member.id,
            reason: err instanceof TimeoutError ? "timeout" : "error",
          },
        });
      }
    }),
  );

  active = active.filter((s) => !s.recused);
  if (shouldFailFromRecusals(memberStates.length, recusals) || active.length < MIN_ACTIVE_MEMBERS) {
    await emit({
      type: "error",
      payload: { message: "too many recusals in closing pitches", fatal: true },
    });
    return;
  }
  if (await costCapBreached()) return;

  // ---- 6. verdict (P1) ----
  await emit({ type: "verdict_started", payload: {} });

  const verdictInput: VerdictPromptInput = {
    dilemma: parsedDilemma,
    axesOfTension: intake.axesOfTension,
    members: active.map((s) => ({ id: s.member.id, name: s.member.name, archetype: s.member.archetype })),
    lockedStances: Object.fromEntries(active.map((s) => [s.member.id, s.stance as Stance])),
    transcripts: Object.fromEntries(
      active.map((s) => [
        s.member.id,
        { statement: s.statementText, rebuttal: s.rebuttalText, closing: s.closingText },
      ]),
    ),
  };

  const { verdict, briefMd } = await withTimeout(
    () => withRateLimitBackoff(() => runVerdict(strongModel, verdictInput)),
    60_000,
    "verdict",
  );
  // P1's runVerdict doesn't report token usage yet — estimate from the pro-tier call.
  noteCost(VERDICT_MODEL, 2000);

  await emit({ type: "verdict_delta", payload: { text: verdict.ruling } });
  await emit({ type: "verdict_done", payload: { verdict, briefMd } });

  const verdictMs = Date.now() - startedAt;
  await emit({
    type: "session_done",
    payload: {
      status: "done",
      metrics: {
        firstCastMs,
        firstTokenMs,
        verdictMs,
        totalCostUsd: cost.total,
        recusals,
      },
    },
  });
}
