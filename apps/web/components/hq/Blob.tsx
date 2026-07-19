"use client";

import { motion } from "framer-motion";
import type { Avatar } from "@council/contract";
import { BLOB_BODY_PATH, HUES, type BlobState } from "@/lib/blobs";

interface BlobProps {
  avatar: Avatar;
  state?: BlobState;
  size?: number;
  className?: string;
}

export function Blob({ avatar, state = "idle", size = 72, className }: BlobProps) {
  const color = HUES[avatar.hue];
  const desaturated = state === "dissent";

  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${avatar.hue} ${avatar.form} council member, ${state}`}
      animate={
        state === "idle"
          ? { y: [0, -3, 0] }
          : state === "talking"
            ? { scale: [1, 1.03, 1] }
            : { rotate: [0, -1.5, 0] }
      }
      transition={{
        duration: state === "talking" ? 0.6 : 2.4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <path
        d={BLOB_BODY_PATH[avatar.form]}
        fill={color}
        opacity={desaturated ? 0.55 : 1}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={1}
      />

      {/* eyes */}
      <circle cx={24} cy={30} r={3.2} fill="#1a1a1a" />
      <circle cx={40} cy={30} r={3.2} fill="#1a1a1a" />

      {/* mouth */}
      {state === "talking" ? (
        <ellipse cx={32} cy={41} rx={5} ry={4} fill="#1a1a1a" />
      ) : state === "dissent" ? (
        <path d="M26 43C29 40 35 40 38 43" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" fill="none" />
      ) : (
        <path d="M26 40C29 43 35 43 38 40" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" fill="none" />
      )}

      {/* furrowed brow, dissent only */}
      {state === "dissent" && (
        <path
          d="M20 24L27 26M44 24L37 26"
          stroke="#1a1a1a"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      )}
    </motion.svg>
  );
}
