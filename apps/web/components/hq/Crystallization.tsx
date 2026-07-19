"use client";

import { motion } from "framer-motion";
import { HUES } from "@/lib/blobs";
import type { MemberView } from "@/lib/session-store";

interface CrystallizationProps {
  members: Record<string, MemberView>;
}

/** The case condensing into a memory orb on session_done — the theme's signature
 * moment (spec 07). Joining the home page's OrbField is that page's concern; this
 * is just the local "condense" beat. */
export function Crystallization({ members }: CrystallizationProps) {
  const hues = Object.values(members).map((m) => HUES[m.hue]);
  const gradient = hues.length > 0 ? `conic-gradient(${hues.join(", ")})` : "var(--terracotta)";

  return (
    <motion.div
      initial={{ scale: 3, opacity: 0 }}
      animate={{ scale: [3, 0.8, 1], opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      className="h-16 w-16 rounded-full"
      style={{ background: gradient, boxShadow: `0 0 30px 8px ${hues[0] ?? "#c96f4a"}55` }}
      aria-hidden="true"
    />
  );
}
