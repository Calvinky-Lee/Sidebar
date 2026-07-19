"use client";

import { motion } from "framer-motion";
import type { ToolChip as ToolChipModel } from "@/lib/session-store";

function describeInput(tool: ToolChipModel["tool"], input: unknown): string {
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (tool === "web_search") {
      if (Array.isArray(obj.queries)) return obj.queries.join(" · ");
      if ("query" in obj) return String(obj.query);
    }
    if (tool === "calculator" && "expression" in obj) return String(obj.expression);
  }
  return typeof input === "string" ? input : JSON.stringify(input);
}

interface ToolChipsProps {
  tools: ToolChipModel[];
  onPin?: (title: string, text: string) => void;
}

/** Tool-use badge under a seat — spec 07 calls this the "unmissable" AI-coordinates-
 * the-real-world moment. Collapsed to a single badge (not one card per call) to
 * keep the seat column compact; click it to see the full findings as a popup. */
export function ToolChips({ tools, onPin }: ToolChipsProps) {
  if (tools.length === 0) return null;

  const anyRunning = tools.some((t) => t.status === "running");
  const doneCount = tools.filter((t) => t.status === "done").length;

  const combinedText = tools
    .map((t, i) => {
      const isSearch = t.tool === "web_search";
      const label = isSearch ? "Web search" : "Calculator";
      const query = describeInput(t.tool, t.input);
      const result = t.status === "running" ? "(searching…)" : (t.summary ?? "");
      return `${i + 1}. ${label}: ${query}\n   → ${result}`;
    })
    .join("\n\n");

  return (
    <motion.button
      type="button"
      onClick={() => onPin?.("evidence", combinedText)}
      initial={{ opacity: 0, y: -4, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-center gap-1 rounded-full border-2 border-ink bg-sage/30 px-2 py-0.5 font-sans text-[10px] text-ink shadow-[1px_1px_0_var(--shadow-beige)]"
    >
      {anyRunning ? "🔍 searching…" : `🔍 ${doneCount} finding${doneCount === 1 ? "" : "s"}`}
    </motion.button>
  );
}
