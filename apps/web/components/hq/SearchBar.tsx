"use client";

import { useEffect, useState } from "react";
import type { SessionSummary } from "@council/contract";

interface SearchBarProps {
  onResults: (sessions: SessionSummary[] | null) => void;
}

export function SearchBar({ onResults }: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (query.trim() === "") {
      onResults(null);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sessions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        onResults(data.sessions ?? []);
      } catch {
        // council service unreachable — ignore, search is best-effort
      }
    }, 300);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, onResults]);

  return (
    <div className="w-full max-w-xl">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search past cases…"
        aria-label="Search past cases"
        className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-white/25"
      />
    </div>
  );
}
