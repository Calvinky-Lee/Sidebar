export default function DevReplayPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold text-neutral-100">Dev fixture replay harness</h1>
      <p className="max-w-md text-neutral-400">
        Will replay a recorded `.jsonl` fixture through the real rendering path at
        1×/4×/instant speed — this is the frontend&apos;s backend until hour 12 (spec
        07, task P3 #3). Not built yet.
      </p>
    </main>
  );
}
