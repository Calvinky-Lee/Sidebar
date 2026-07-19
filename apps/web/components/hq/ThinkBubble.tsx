"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import type { MemberView } from "@/lib/session-store";

type PhaseKey = "firstRead" | "statement" | "rebuttal" | "closing";

const PHASE_META: Record<PhaseKey, { icon: string; label: string }> = {
  firstRead: { icon: "💭", label: "first read" },
  statement: { icon: "🗣", label: "opinion" },
  rebuttal: { icon: "🔄", label: "reading the others" },
  closing: { icon: "🎯", label: "pitch to the Chair" },
};

const PHASE_ORDER: PhaseKey[] = ["firstRead", "statement", "rebuttal", "closing"];

function getPhaseContent(
  member: MemberView,
  phase: PhaseKey,
): { bubble: string; fullText?: string } | undefined {
  switch (phase) {
    case "firstRead":
      return member.phases.firstRead;
    case "statement":
      return member.phases.statement;
    case "rebuttal":
      return member.phases.rebuttal;
    case "closing":
      return member.phases.closing;
  }
}

function Triangle({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
      <path d={direction === "left" ? "M8 1 L2 5 L8 9 Z" : "M2 1 L8 5 L2 9 Z"} />
    </svg>
  );
}

interface ThinkBubbleProps {
  member: MemberView;
  compact?: boolean;
  onPin?: (title: string, text: string) => void;
  /** Name of the member being quoted, when the shown phase is a rebuttal with `quotedPersonaId` set. */
  quotedName?: string;
}

export function ThinkBubble({ member, compact = false, onPin, quotedName }: ThinkBubbleProps) {
  // Persists across renders so the arrows/arrow-keys can step through phase
  // history; reset to null whenever a new phase actually arrives, so the bubble
  // follows the latest phase again by default.
  const [selected, setSelected] = useState<PhaseKey | null>(null);

  const reached = PHASE_ORDER.filter((p) => getPhaseContent(member, p));
  const latest = reached[reached.length - 1];

  useEffect(() => {
    setSelected(null);
  }, [latest]);

  if (reached.length === 0) return null;

  const shown = selected ?? latest;
  const shownIndex = reached.indexOf(shown);
  const content = getPhaseContent(member, shown);
  const meta = PHASE_META[shown];

  const streaming = member.streaming?.text;
  const displayText = streaming ?? content?.bubble ?? "…";
  const pointsInward = shown === "closing" && member.orientedToChair;

  const step = (delta: 1 | -1) => {
    const nextIndex = Math.min(Math.max(shownIndex + delta, 0), reached.length - 1);
    setSelected(reached[nextIndex]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (reached.length < 2) return;
    e.preventDefault();
    step(e.key === "ArrowRight" ? 1 : -1);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={() => content?.fullText && onPin?.(meta.label, content.fullText)}
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
        className={`relative overflow-hidden rounded-2xl border-2 border-ink bg-card px-3 pb-2 pt-5 text-left shadow-[2px_2px_0_var(--shadow-beige)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta ${
          compact ? "h-20 w-32" : "h-28 w-44"
        } ${content?.fullText ? "cursor-pointer" : "cursor-default"}`}
      >
        <span
          className={`absolute h-2 w-2 rotate-45 border-ink bg-card ${
            pointsInward
              ? "-top-[5px] left-1/2 -ml-1 border-l-2 border-t-2"
              : "-bottom-[5px] left-1/2 -ml-1 border-b-2 border-r-2"
          }`}
        />
        <span className="absolute inset-x-0 top-0 rounded-t-[14px] border-b border-ink/15 bg-ink/5 px-3 py-0.5 font-sans text-[10px] text-ink-soft">
          {meta.icon} {meta.label}
        </span>
        <p
          className={`font-sans text-xs text-ink ${compact ? "line-clamp-2" : "line-clamp-3"}`}
        >
          {displayText}
        </p>
        {shown === "rebuttal" && quotedName && (
          <span className="absolute -bottom-4 left-0 whitespace-nowrap font-sans text-[9px] text-dusty-blue">
            ↩ quoting {quotedName}
          </span>
        )}
      </motion.button>

      {reached.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={shownIndex === 0}
            aria-label="previous phase"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-ink/40 text-ink-soft disabled:opacity-25"
          >
            <Triangle direction="left" />
          </button>
          <div className="flex gap-1" aria-hidden="true">
            {reached.map((p) => (
              <span
                key={p}
                className={`h-1.5 w-1.5 rounded-full ${
                  p === shown ? "bg-terracotta" : "bg-ink-soft/40"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={shownIndex === reached.length - 1}
            aria-label="next phase"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-ink/40 text-ink-soft disabled:opacity-25"
          >
            <Triangle direction="right" />
          </button>
        </div>
      )}
    </div>
  );
}
