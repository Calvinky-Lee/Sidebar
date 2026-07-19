"use client";

import { motion } from "framer-motion";
import type { Phase } from "@council/contract";

const STEPS: { phase: Phase; label: string }[] = [
  { phase: "intake", label: "Understanding the case" },
  { phase: "casting", label: "Convening the council" },
  { phase: "statements", label: "Forming opinions" },
  { phase: "rebuttal", label: "Deliberating" },
  { phase: "closing", label: "Pitches to the Chair" },
  { phase: "verdict", label: "Decision" },
];

interface PhaseTrackerProps {
  phase: Phase;
  done?: boolean;
}

export function PhaseTracker({ phase, done = false }: PhaseTrackerProps) {
  const currentIndex = STEPS.findIndex((s) => s.phase === phase);

  return (
    <ol className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((step, i) => {
        const isDone = done || i < currentIndex;
        const isCurrent = !done && i === currentIndex;
        return (
          <li key={step.phase} className="flex items-center gap-1.5">
            <motion.span
              animate={isCurrent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 1.4, repeat: isCurrent ? Infinity : 0, ease: "easeInOut" }}
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink font-hand text-xs ${
                isDone ? "bg-sage text-card" : isCurrent ? "bg-terracotta text-card" : "bg-card text-ink-soft"
              }`}
            >
              {isDone ? "✓" : i + 1}
            </motion.span>
            <span
              className={`font-sans text-xs sm:text-sm ${
                isCurrent ? "text-ink" : "text-ink-soft"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
