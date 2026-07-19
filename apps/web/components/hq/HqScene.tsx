"use client";

import { useState } from "react";
import { BackgroundDoodles } from "@/components/BackgroundDoodles";
import { Chair } from "@/components/hq/Chair";
import { Crystallization } from "@/components/hq/Crystallization";
import { DecisionTheater } from "@/components/hq/DecisionTheater";
import { DiversityMeter } from "@/components/hq/DiversityMeter";
import { PhaseTracker } from "@/components/hq/PhaseTracker";
import { PinnedPanel } from "@/components/hq/PinnedPanel";
import { SeatRing } from "@/components/hq/SeatRing";
import { VectorGraph } from "@/components/sidebar/VectorGraph";
import { useHqSession } from "@/lib/use-hq-session";

interface HqSceneProps {
  sessionId: string;
}

export function HqScene({ sessionId }: HqSceneProps) {
  const { state, connectionError } = useHqSession(sessionId);
  const [pinned, setPinned] = useState<{ title: string; text: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isFocused = state.phase === "verdict";

  const dissentPersonaId = state.verdict?.dissent
    ? (Object.values(state.members).find(
        (m) => m.member.id === state.verdict!.dissent!.who || m.member.name === state.verdict!.dissent!.who,
      )?.member.id)
    : undefined;

  return (
    <>
      <BackgroundDoodles />
      <div className="paper-grain" />
      <main className="relative z-10 flex min-h-screen flex-col items-center gap-8 px-4 py-10">
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle diversity sidebar"
          className="fixed right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-card text-ink shadow-[2px_2px_0_var(--shadow-beige)]"
        >
          ⿻
        </button>

        <PhaseTracker phase={state.phase} done={state.status === "done"} />

        {state.summary && (
          <div className="w-full max-w-xl rounded-2xl border-2 border-ink bg-card px-4 py-3 text-center shadow-[3px_3px_0_var(--shadow-beige)]">
            <p className="font-sans text-sm text-ink">{state.summary}</p>
            {state.axesOfTension && state.axesOfTension.length > 0 && (
              <p className="mt-1 font-sans text-xs text-ink-soft">
                tension: {state.axesOfTension.join(" · ")}
              </p>
            )}
          </div>
        )}

        <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl flex-1">
          {state.councilSize ? (
            <SeatRing
              councilSize={state.councilSize}
              seatOrder={state.seatOrder}
              members={state.members}
              onPin={(title, text) => setPinned({ title, text })}
              dissentPersonaId={dissentPersonaId}
            />
          ) : (
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-hand text-lg text-ink-soft">
              convening the council…
            </p>
          )}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Chair focused={isFocused} />
          </div>
        </div>

        <DiversityMeter score={state.diversityScore} baselineRatio={state.baselineRatio} />

        {state.verdict && state.briefMd && (
          <DecisionTheater verdict={state.verdict} briefMd={state.briefMd} members={state.members} />
        )}

        {state.status === "done" && <Crystallization members={state.members} />}

        {connectionError && (
          <p className="font-sans text-sm text-terracotta">{connectionError}</p>
        )}
        {state.error && (
          <p className="font-sans text-sm text-terracotta">{state.error.message}</p>
        )}
      </main>

      <PinnedPanel
        title={pinned?.title ?? null}
        text={pinned?.text ?? null}
        onClose={() => setPinned(null)}
      />

      <VectorGraph
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        vectorMap={state.vectorMap}
        members={state.members}
        diversityScore={state.diversityScore}
        baselineRatio={state.baselineRatio}
      />
    </>
  );
}
