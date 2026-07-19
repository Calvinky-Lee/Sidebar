"use client";

import { useState } from "react";
import type { SessionSummary } from "@council/contract";
import { SearchBar } from "@/components/hq/SearchBar";
import { OrbField } from "@/components/hq/OrbField";
import { IntakeForm } from "@/components/intake/IntakeForm";
import { Blob } from "@/components/hq/Blob";

const PREVIEW_AVATARS = [
  { hue: "sky", form: "round" },
  { hue: "ember", form: "spiky" },
  { hue: "jade", form: "tall" },
  { hue: "magenta", form: "squat" },
] as const;

export default function Home() {
  const [searchResults, setSearchResults] = useState<SessionSummary[] | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 px-4 py-16">
      <div className="flex items-center gap-3">
        {PREVIEW_AVATARS.map((avatar) => (
          <Blob key={avatar.hue} avatar={avatar} size={40} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-semibold text-neutral-100">The Council</h1>
        <p className="max-w-md text-neutral-400">
          File your case. The Chair convenes a council of 3–6 AI members, sized to the
          dilemma, to argue it out and deliver a verdict.
        </p>
      </div>

      <SearchBar onResults={setSearchResults} />

      <IntakeForm />

      <section className="w-full max-w-3xl">
        <OrbField searchResults={searchResults} />
      </section>
    </main>
  );
}
