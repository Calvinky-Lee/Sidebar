"use client";

import { AnimatePresence, motion } from "framer-motion";

interface PinnedPanelProps {
  title: string | null;
  text: string | null;
  onClose: () => void;
}

export function PinnedPanel({ title, text, onClose }: PinnedPanelProps) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[70vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-ink bg-card p-5 shadow-[4px_4px_0_var(--shadow-beige)]"
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <h3 className="font-hand text-lg capitalize text-ink">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full font-sans text-sm text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                ✕
              </button>
            </div>
            <p className="whitespace-pre-wrap font-sans text-sm text-ink">{text}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
