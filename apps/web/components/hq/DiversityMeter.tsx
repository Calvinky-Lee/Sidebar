"use client";

import { motion } from "framer-motion";

interface DiversityMeterProps {
  score?: number;
  baselineRatio?: number;
}

export function DiversityMeter({ score, baselineRatio }: DiversityMeterProps) {
  const pct = score !== undefined ? Math.min(100, Math.round(score * 100)) : 0;

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-1">
      <div className="flex w-full items-center gap-2">
        <span className="font-sans text-xs text-ink-soft">diversity</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-ink/40 bg-card">
          <motion.div
            className="h-full bg-dusty-blue"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        </div>
        {baselineRatio !== undefined && (
          <span className="font-sans text-xs text-ink-soft">{baselineRatio.toFixed(1)}×</span>
        )}
      </div>
    </div>
  );
}
