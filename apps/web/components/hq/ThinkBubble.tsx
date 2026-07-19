"use client";

import { useState } from "react";
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

interface ThinkBubbleProps {
  member: MemberView;
  compact?: boolean;
  onPin?: (title: string, text: string) => void;
  /** Name of the member being quoted, when the shown phase is a rebuttal with `quotedPersonaId` set. */
  quotedName?: string;
}

export function ThinkBubble({ member, compact = false, onPin, quotedName }: ThinkBubbleProps) {
  const [hovered, setHovered] = useState<PhaseKey | null>(null);

  const reached = PHASE_ORDER.filter((p) => getPhaseContent(member, p));
  if (reached.length === 0) return null;

  const latest = reached[reached.length - 1];
  const shown = hovered ?? latest;
  const content = getPhaseContent(member, shown);
  const meta = PHASE_META[shown];

  const streaming = member.streaming?.text;
  const displayText = streaming ?? content?.bubble ?? "…";
  const pointsInward = shown === "closing" && member.orientedToChair;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={() => content?.fullText && onPin?.(meta.label, content.fullText)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
        className={`relative rounded-2xl border-2 border-ink bg-card px-3 py-2 text-left shadow-[2px_2px_0_var(--shadow-beige)] ${
          compact ? "h-16 w-32" : "h-20 w-44"
        } ${content?.fullText ? "cursor-pointer" : "cursor-default"}`}
        style={{
          maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
        }}
      >
        <span
          className={`absolute h-2 w-2 rotate-45 border-ink bg-card ${
            pointsInward
              ? "-top-[5px] left-1/2 -ml-1 border-l-2 border-t-2"
              : "-bottom-[5px] left-1/2 -ml-1 border-b-2 border-r-2"
          }`}
        />
        <span className="font-sans text-[10px] text-ink-soft">
          {meta.icon} {meta.label}
        </span>
        <p className="mt-0.5 line-clamp-3 font-sans text-xs text-ink">{displayText}</p>
        {shown === "rebuttal" && quotedName && (
          <span className="absolute -bottom-4 left-0 whitespace-nowrap font-sans text-[9px] text-dusty-blue">
            ↩ quoting {quotedName}
          </span>
        )}
      </motion.button>

      {reached.length > 1 && (
        <div className="flex gap-1">
          {reached.map((p) => (
            <button
              key={p}
              type="button"
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`show ${PHASE_META[p].label}`}
              className={`h-1.5 w-1.5 rounded-full ${
                p === latest ? "bg-terracotta" : "bg-ink-soft/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
