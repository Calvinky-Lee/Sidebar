"use client";

import { motion } from "framer-motion";
import { BLOB_BODY_PATH } from "@/lib/blobs";

interface ChairProps {
  size?: number;
  focused?: boolean;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

/** The Chair: a larger, neutral-toned figure at the center of the HQ — never a
 * persona hue, since hue is member identity everywhere else (spec 07). */
export function Chair({ size = 120, focused = false, className, clickable = false, onClick }: ChairProps) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={clickable ? "The Chair — click to view the ruling" : "The Chair"}
      onClick={clickable ? onClick : undefined}
      style={{ transformOrigin: "50% 100%", cursor: clickable ? "pointer" : undefined }}
      animate={
        focused
          ? { scale: [1, 1.05, 1] }
          : { y: [0, -6, 0], scaleY: [0.92, 1.08, 0.92], scaleX: [1.05, 0.96, 1.05] }
      }
      transition={{
        duration: focused ? 0.8 : 2.2,
        repeat: Infinity,
        ease: focused ? "easeInOut" : ["easeOut", "easeIn"],
      }}
    >
      <path
        d={BLOB_BODY_PATH.round}
        fill="var(--ink-soft)"
        stroke="var(--ink)"
        strokeWidth={1.5}
        opacity={0.9}
      />
      <circle cx={24} cy={30} r={3.4} fill="var(--card)" />
      <circle cx={40} cy={30} r={3.4} fill="var(--card)" />
      <path
        d="M25 41C28 44 36 44 39 41"
        stroke="var(--card)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {focused && (
        <circle
          cx={32}
          cy={32}
          r={30}
          fill="none"
          stroke="var(--terracotta)"
          strokeWidth={1}
          opacity={0.4}
        />
      )}
    </motion.svg>
  );
}
