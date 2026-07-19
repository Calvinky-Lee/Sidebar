"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function IntakeForm() {
  const [dilemma, setDilemma] = useState("");
  const [context, setContext] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "unreachable">("idle");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dilemma.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dilemma, context: context || undefined }),
      });
      if (!res.ok) throw new Error("session creation failed");
      const data = await res.json();
      router.push(`/session/${data.id}`);
    } catch {
      setStatus("unreachable");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3">
      <textarea
        value={dilemma}
        onChange={(e) => setDilemma(e.target.value)}
        placeholder="File your case — what's the dilemma?"
        aria-label="Your dilemma"
        rows={3}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-white/25"
      />
      <input
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Optional context"
        aria-label="Optional context"
        className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-white/25"
      />
      <button
        type="submit"
        disabled={!dilemma.trim() || status === "submitting"}
        className="self-center rounded-full bg-neutral-100 px-6 py-2 font-medium text-neutral-900 transition-opacity disabled:opacity-40"
      >
        {status === "submitting" ? "Convening…" : "Convene the council"}
      </button>
      {status === "unreachable" && (
        <p className="text-center text-sm text-red-400">
          Council service isn&apos;t running yet — this is a stub route until the backend is wired up.
        </p>
      )}
    </form>
  );
}
