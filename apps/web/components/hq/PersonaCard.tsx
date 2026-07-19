"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CastMember } from "@council/contract";

interface PersonaCardProps {
  member: CastMember;
  hue: string;
  children: ReactNode;
}

/** Wraps a trigger element (Nameplate, vector point, ...): hover shows a compact
 * popover, click pins the full card. All data comes from `persona_cast` — no fetch. */
export function PersonaCard({ member, hue, children }: PersonaCardProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setPinned((p) => !p)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
            style={{ borderColor: hue }}
            className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 cursor-default rounded-2xl border-2 bg-card p-3 text-left shadow-[3px_3px_0_var(--shadow-beige)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-hand text-sm text-ink">{member.archetype}</p>
            <p className="font-sans text-xs text-ink-soft">{member.stanceProfile.decisionStyle}</p>
            <p className="mt-1 font-sans text-[10px] text-ink-soft">
              values: {member.stanceProfile.coreValues.slice(0, 3).join(", ")}
            </p>

            {pinned && (
              <div className="mt-2 space-y-1 border-t border-ink/20 pt-2">
                <p className="font-sans text-[10px] text-ink-soft">
                  <strong>biases:</strong> {member.stanceProfile.biases.join(", ")}
                </p>
                <p className="font-sans text-[10px] text-ink-soft">
                  <strong>voice:</strong> {member.voice}
                </p>
                <p className="font-sans text-[10px] text-ink-soft">
                  <strong>domains:</strong> {member.domains.join(", ")}
                </p>
                {member.situationBrief && (
                  <p className="font-sans text-[10px] text-ink-soft">
                    <strong>brief:</strong> {member.situationBrief}
                  </p>
                )}
                {member.model && (
                  <p className="font-sans text-[10px] text-ink-soft">
                    <strong>model:</strong> {member.model.id} — {member.model.reason}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
