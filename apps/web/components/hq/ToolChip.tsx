"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ToolChip as ToolChipModel } from "@/lib/session-store";

function describeInput(tool: ToolChipModel["tool"], input: unknown): string {
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (tool === "web_search" && "query" in obj) return String(obj.query);
    if (tool === "calculator" && "expression" in obj) return String(obj.expression);
  }
  return typeof input === "string" ? input : JSON.stringify(input);
}

interface ToolChipsProps {
  tools: ToolChipModel[];
}

/** Tool-use chips under a seat — spec 07 calls this the "unmissable" AI-coordinates-
 * the-real-world moment, so it stays visible (not folded into the bubble). */
export function ToolChips({ tools }: ToolChipsProps) {
  if (tools.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <AnimatePresence>
        {tools.map((t) => (
          <motion.div
            key={t.callId}
            initial={{ opacity: 0, y: -4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex max-w-[9rem] items-center gap-1 rounded-full border-2 border-ink bg-sage/30 px-2 py-0.5 font-sans text-[10px] text-ink shadow-[1px_1px_0_var(--shadow-beige)]"
          >
            <span>{t.tool === "web_search" ? "🔍" : "🧮"}</span>
            <span className="truncate">
              {t.status === "running"
                ? `${t.tool === "web_search" ? "searching" : "computing"}: ${describeInput(t.tool, t.input)}`
                : t.summary}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
